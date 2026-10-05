import {IsEmail, IsString, Matches} from 'class-validator';
import {Trim} from "../../../core/decorators/transform/trim";
import {
    loginConstraints,
    passwordConstraints,
    emailConstraints } from "../domain/user.entity";
import {IsStringWithTrim} from "../../../core/decorators/validation/is-string-with-trim";

export class CreateUserDto {
    @IsStringWithTrim(loginConstraints.minLength, loginConstraints.maxLength)
    @Matches(loginConstraints.match)
    login: string;

    @IsString()
    @IsEmail()
    @Trim()
    @Matches(emailConstraints.match)
    email: string;

    @IsStringWithTrim(passwordConstraints.minLength, passwordConstraints.maxLength)
    password: string;
}

export class UpdateUserDto {
    @IsString()
    @IsEmail()
    @Trim()
    @Matches(emailConstraints.match)
    email: string;
}