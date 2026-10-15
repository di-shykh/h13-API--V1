import {
    Body,
    Controller,
    Post,
    UseGuards,
    Get,
    HttpCode,
    HttpStatus,
    Res
} from '@nestjs/common';
import type { Response } from 'express';
import {UsersService} from "../application/users-service";
import {AuthService} from "../application/auth.service";
import {CreateUserInputDto} from "./input-dto/users.input-dto";
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import {UserContextDto} from "../guards/dto/user-context.dto";
import {ExtractUserFromRequest} from "../guards/decorators/param/extract-user-from-request.decorator";
import {JwtAuthGuard} from "../guards/bearer/jwt-auth.guard";
import {MeViewDto} from "./view-dto/user.view-dto";
import {AuthQueryRepository} from "../infrastructure/query/auth.query-repository";
import {RateLimitGuard} from "../guards/rate-limit/rate-limit.guard";
import {UpdateUserInputDto} from "./input-dto/update-user.input-dto";
import {ConfirmationCodeInputDto} from "../dto/confirmation-code.input-dto";
import {NewPasswordInputDto} from "./input-dto/new-password.input-dto";

@Controller('auth')
export class AuthController {
    constructor(
        private usersService: UsersService,
        private authService: AuthService,
        private authQueryRepository: AuthQueryRepository,
    ) {}
    @Post('registration')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(RateLimitGuard)
    registration(@Body() body: CreateUserInputDto): Promise<void> {
        return this.usersService.registerUser(body);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @UseGuards(LocalAuthGuard)
    //swagger doc
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                loginOrEmail: { type: 'string', example: 'login123' },
                password: { type: 'string', example: 'superpassword' },
            },
        },
    })
    async login(
        @ExtractUserFromRequest() user: UserContextDto,
        @Res({ passthrough: true }) res: Response, // <-- 1. Добавляем объект ответа с passthrough: true
    ): Promise<{accessToken: string}> {
        const { accessToken, refreshToken } = await this.authService.login(user.userId);
        res.cookie('refreshToken', refreshToken,
            {
                httpOnly: true,
                secure: true,
            });
        return { accessToken };
    }

    @ApiBearerAuth()
    @Get('me')
    @UseGuards(JwtAuthGuard)
    me(@ExtractUserFromRequest() user: UserContextDto): Promise<MeViewDto> {
        return this.authQueryRepository.me(user.userId);
    }

    @Post('registration-confirmation')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(RateLimitGuard)
    registrationConfirmation(@Body() dto: ConfirmationCodeInputDto): Promise<void> {
        return this.authService.confirmUserRegistration(dto.code);
    }

    @Post('new-password')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(RateLimitGuard)
    newPassword(@Body() dto: NewPasswordInputDto): Promise<void> {
        return this.authService.newPassword(dto.newPassword, dto.recoveryCode);
    }

    @Post('password-recovery')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(RateLimitGuard)
    passwordRecovery(@Body() dto: UpdateUserInputDto): Promise<void> {
        return this.authService.passwordRecovery(dto);
    }
    @Post('registration-email-resending')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(RateLimitGuard)
    registrationEmailResending(@Body() dto: UpdateUserInputDto) {
       return this.authService.resendEmail(dto);
    }
}
