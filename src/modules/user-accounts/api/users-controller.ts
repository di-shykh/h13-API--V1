import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    Query, UseGuards,
} from '@nestjs/common';
import { UsersQueryRepository } from '../infrastructure/query/users.query-repository';
import { UserViewDto } from './view-dto/user.view-dto';
import { UsersService } from '../application/users-service';
import { CreateUserInputDto } from './input-dto/users.input-dto';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';
import { ApiParam } from '@nestjs/swagger';
import { UpdateUserInputDto } from './input-dto/update-user.input-dto';
import { GetUsersQueryParams } from './input-dto/get-users-query-params.input-dto';
import {BasicAuthGuard} from "../guards/basic/basic-auth.guard";
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import {CommandBus} from "@nestjs/cqrs";
import {CreateUserCommand} from "../application/use-cases/create-user.use-case";
import {UpdateUserCommand} from "../application/use-cases/update-user.use-case";
import {DeleteUserCommand} from "../application/use-cases/delete-user.use-case";

@Controller('users')
export class UsersController {
    constructor(
        private usersQueryRepository: UsersQueryRepository,
        private usersService: UsersService,
        private commandBus: CommandBus,
    ) {
        console.log('UsersController created');
    }

    @ApiParam({ name: 'id' })
    @Get(':id')
    async getById(@Param('id') id: string): Promise<UserViewDto> {
        return this.usersQueryRepository.getByIdOrNotFoundFail(id);
    }

    @Get()
    @UseGuards(BasicAuthGuard)
    async getAll(
        @Query() query: GetUsersQueryParams): Promise<PaginatedViewDto<UserViewDto[]>> {
        return this.usersQueryRepository.getAll(query);
    }

    @Post()
    @UseGuards(BasicAuthGuard)
    async createUser(@Body() body: CreateUserInputDto): Promise<UserViewDto> {
        const userId = await this.commandBus.execute(new CreateUserCommand(body));
        return this.usersQueryRepository.getByIdOrNotFoundFail(userId);
    }

    @Put(':id')
    @UseGuards(BasicAuthGuard)
    async updateUser(
        @Param('id') id: string,
        @Body() body: UpdateUserInputDto,
    ): Promise<UserViewDto> {
        const userId = await this.commandBus.execute(new UpdateUserCommand(id, body));

        return this.usersQueryRepository.getByIdOrNotFoundFail(userId);
    }

    @ApiParam({ name: 'id' })
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(BasicAuthGuard)
    async deleteUser(@Param('id', ParseObjectIdPipe) id: Types.ObjectId): Promise<void> {
        return this.commandBus.execute(new DeleteUserCommand (id.toString()));
    }
}
