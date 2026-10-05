import {Injectable} from "@nestjs/common";
import {AuthService} from "../../application/auth.service";
import {DomainException} from "../../../../core/exceptions/domain-exceptions";
import {DomainExceptionCode} from "../../../../core/exceptions/domain-exception-codes";
import {UserContextDto} from "../dto/user-context.dto";
import {PassportStrategy} from "@nestjs/passport";
import { Strategy } from 'passport-local';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy){
    constructor(private authService: AuthService) {
        super({
            usernameField: 'loginOrEmail',
            passwordField: 'password'
        });
    }
    async validate(username: string, password: string): Promise<UserContextDto> {
        const user = await this.authService.validateUser(username, password);
        if (!user) {
            throw new DomainException({
                code: DomainExceptionCode.Unauthorized,
                message: `Invalid loginOrEmail or password`,
                extensions: [
                    { message: `Invalid loginOrEmail or password`, field: 'loginOrEmail' },
                ]
            })
        }
        return user;
    }
}