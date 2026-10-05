import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import type {UserModelType} from "../domain/user.entity";
import {User} from "../domain/user.entity";
import {CreateUserDto, UpdateUserDto} from "../dto/create-user.dto";
import { CryptoService } from './crypto.service';
import { EmailService } from '../../notifications/email.service';
import {UsersRepository} from "../infrastructure/users.repository";
import {DomainException} from "../../../core/exceptions/domain-exceptions";
import {DomainExceptionCode} from "../../../core/exceptions/domain-exception-codes";
import {randomUUID} from "crypto";

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name)
        private UserModel: UserModelType,
        private usersRepository: UsersRepository,
        private cryptoService: CryptoService,
        private emailService: EmailService,
    ) { }
    async createUser(dto: CreateUserDto): Promise<string> {
        const userWithTheSameLogin = await this.usersRepository.findByLogin(dto.login);
        if (!!userWithTheSameLogin) {
            throw new DomainException({
                code: DomainExceptionCode.BadRequest,
                message: `User with the same login already exists`,
                extensions: [
                    { message: `User with the same login already exists`, field: 'login' },
                ]
            });
        }

        const userWithTheSameEmail = await this.usersRepository.findByEmail(dto.email);
        if (!!userWithTheSameEmail) {
            throw new DomainException({
                code: DomainExceptionCode.BadRequest,
                message: `User with the same email already exists`,
                extensions: [
                    { message: `User with the same email already exists`, field: 'email' },
                ]
            })
        }

        const passwordHash = await this.cryptoService.createPasswordHash(dto.password);
        const user = this.UserModel.createInstance({
            email: dto.email,
            login: dto.login,
            passwordHash: passwordHash,
        })
        await this.usersRepository.save(user);
        return user._id.toString();
    }
    async updateUser(id: string, dto: UpdateUserDto): Promise<string> {
        const user = await this.usersRepository.findOrNotFoundFail(id);
        user.update(dto);
        await this.usersRepository.save(user);
        return user._id.toString();
    }
    async deleteUser(id: string) {
        const user = await this.usersRepository.findOrNotFoundFail(id);
        user.makeDeleted();
        await this.usersRepository.save(user);
    }
    async registerUser(dto: CreateUserDto): Promise<void> {
        const createdUserId = await this.createUser(dto);

        const confirmCode: string = randomUUID();

        const user = await this.usersRepository.findOrNotFoundFail(createdUserId);
        user.setConfirmationCode(confirmCode);
        await this.usersRepository.save(user);

        this.emailService
            .sendConfirmationEmail(user.email, confirmCode)
            .catch(console.error);
    }
}

