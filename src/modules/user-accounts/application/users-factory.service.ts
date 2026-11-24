import {Injectable} from "@nestjs/common";
import {User, UserDocument, type UserModelType} from "../domain/user.entity";
import {InjectModel} from "@nestjs/mongoose";
import {CryptoService} from "./crypto.service";
import {UsersRepository} from "../infrastructure/users.repository";
import {DomainException} from "../../../core/exceptions/domain-exceptions";
import {DomainExceptionCode} from "../../../core/exceptions/domain-exception-codes";

@Injectable()
export class UsersFactory {
    constructor(
        @InjectModel(User.name) private userModel: UserModelType,
        private readonly usersRepository: UsersRepository,
        private readonly cryptoService: CryptoService,
    ) {}
    async create(dto: { login: string, email: string, password: string}): Promise<UserDocument> {
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
        const user = this.userModel.createInstance({
            email: dto.email,
            login: dto.login,
            passwordHash,
        });
        //await this.usersRepository.save(user);
        return user;
    }
}