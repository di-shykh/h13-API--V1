import { Injectable } from '@nestjs/common';
import {UsersRepository} from "../infrastructure/users.repository";
import {CryptoService} from "./crypto.service";
import { JwtService } from '@nestjs/jwt';
import { UserContextDto } from '../guards/dto/user-context.dto';
import {DomainException} from "../../../core/exceptions/domain-exceptions";
import {DomainExceptionCode} from "../../../core/exceptions/domain-exception-codes";
import {PasswordRecovery} from "../domain/password-recovery.entity";
import {PasswordRecoveryRepository} from "../infrastructure/password-recovery.repository";
import {UpdateUserInputDto} from "../api/input-dto/update-user.input-dto";
import { randomUUID } from 'crypto';
import {EmailService} from "../../notifications/email.service";

@Injectable()
export class AuthService {
    constructor(
        private usersRepository: UsersRepository,
        private jwtService: JwtService,
        private cryptoService: CryptoService,
        private passwordRecoveryRepository: PasswordRecoveryRepository,
        private emailService: EmailService,
    ) {}
    async login(userId: string) {
        const accessToken = await this.jwtService.sign({ id: userId } as UserContextDto);
        return {
            accessToken
        };
    }
    async validateUser(loginOrEmail: string, password: string): Promise<UserContextDto | null> {
        const user = await this.usersRepository.findByLoginOrEmail(loginOrEmail)
        if (!user) {
            return null;
        }
        const isPasswordValid = await this.cryptoService.checkPassword(password, user.passwordHash)
        if (!isPasswordValid) {
            return null;
        }
        return {id: user._id.toString()};
    }
    async confirmUserRegistration(code: string) {
        if(!code || code.length !== 36) {
            throw new DomainException({
                code: DomainExceptionCode.BadRequest,
                message: `Invalid confirmation code format`,
                extensions: [
                    { message: `Invalid confirmation code format`, field: 'code' },
                ]
            })
        }
        const user = await this.usersRepository.findByConfirmationCode(code)
        if (!user) {
            throw new DomainException({
                code: DomainExceptionCode.BadRequest,
                message: `Code does not exist`,
                extensions: [
                    { message: `Code does not exist`, field: 'code' },
                ]
            })
        }
        user.confirmEmail(code);
        await this.usersRepository.save(user);
    }
    async newPassword(newPassword: string, recoveryCode: string) {
        const recoveryResult = await this.passwordRecoveryRepository.findByCode(recoveryCode);
        if (!recoveryResult) {
            throw new DomainException({
                code: DomainExceptionCode.BadRequest,
                message: `Code does not exist`,
                extensions: [
                    { message: `Code does not exist`, field: 'code' },
                ]
            })
        }
        if(!recoveryResult.isValid(recoveryCode)) {
            throw new DomainException({
                code: DomainExceptionCode.BadRequest,
                message: `Recovery code is not valid`,
                extensions: [
                    { message: `Recovery code is not valid`, field: 'code' },
                ]
            })
        }
        const user = await this.usersRepository.findById(recoveryResult.userId);
        if(!user) {
            throw new DomainException({
                code: DomainExceptionCode.BadRequest,
                message: `User not found`,
                extensions: [
                    { message: `User not found`, field: 'userId' },
                ]
            })
        }
        const newPasswordHash: string = await this.cryptoService.createPasswordHash(newPassword);
        user.setPassword(newPasswordHash);
        recoveryResult.use(recoveryCode);
        await this.usersRepository.save(user);
        await this.passwordRecoveryRepository.save(recoveryResult);
    }
    async passwordRecovery(dto: UpdateUserInputDto): Promise<void> {
        const normalizedEmail = dto.email.toLowerCase();
        const user = await this.usersRepository.findByEmail(normalizedEmail)
        if (!user) {
            return;
        }
        const passwordRecovery = PasswordRecovery.createPasswordRecovery(user._id.toString());
        await this.passwordRecoveryRepository.save(passwordRecovery);
        const recoveryCode: string = passwordRecovery.passwordRecoveryCode;
        try {
            const result = this.emailService
                .sendPasswordRecoveryEmail(user.email, recoveryCode);
            console.log(`Password recovery email sent to: ${user.email}`);
        } catch(error) {
            console.error(`Failed to send password recovery email to ${user.email}:`, error);
        }
    }
    async resendEmail(dto: UpdateUserInputDto): Promise<void> {
        const normalizedEmail = dto.email.toLowerCase();
        const user = await this.usersRepository.findByEmail(normalizedEmail)
        if (!user) {
            throw new DomainException({
                code: DomainExceptionCode.BadRequest,
                message: `User with this email is not exists`,
                extensions: [
                    { message: `User with this email is not exists`, field: 'email' },
                ]
            })
        }
        if(user.emailConfirmation?.isConfirmed){
            throw new DomainException({
                code: DomainExceptionCode.BadRequest,
                message: `Email is already confirmed`,
                extensions: [
                    { message: `Email is already confirmed`, field: 'email' },
                ]
            })
        }
        const confirmationCode: string = randomUUID();
        try {
            await this.emailService.sendConfirmationEmail(user.email, confirmationCode);
            user.updateEmailConfirmationData(confirmationCode);
            await this.usersRepository.save(user);
        } catch (e) {
            // const message: string = e instanceof Error ? e.message : 'Email wasn\'t confirmed';
            // throw new DomainException({
            //     code: DomainExceptionCode.BadRequest,
            //     message: message,
            //     extensions: [
            //         { message: message, field: 'email' },
            //     ]
            // })
            console.error(`Failed to send confirmation email to ${user.email}:`, e);
        }
    }
}