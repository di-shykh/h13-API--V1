import {
    Body,
    Controller,
    Post,
    UseGuards,
    Get,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
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
    login(
        @ExtractUserFromRequest() user: UserContextDto,
    ): Promise<{accessToken: string}> {
        return this.authService.login(user.id);
    }

    @ApiBearerAuth()
    @Get('me')
    @UseGuards(JwtAuthGuard)
    me(@ExtractUserFromRequest() user: UserContextDto): Promise<MeViewDto> {
        return this.authQueryRepository.me(user.id);
    }

    @Post('registration-confirmation')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(RateLimitGuard)
    registrationConfirmation(@Body() dto: ConfirmationCodeInputDto): Promise<void> {
        return this.authService.confirmUserRegistration(dto.code);
    }

    @Post('new-password')
    @HttpCode(HttpStatus.NO_CONTENT)
    newPassword(@Body() newPassword: string, recoveryCode: string): Promise<void> {
        return this.authService.newPassword(newPassword, recoveryCode);
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
