import {CreateUserDto} from "../../dto/create-user.dto";
import {IsEmail, IsNotEmpty, IsString, Length, Matches} from 'class-validator';
import { Trim } from '../../../../core/decorators/transform/trim';
import {
    loginConstraints,
    passwordConstraints,
    emailConstraints,
} from '../../domain/user.entity';
import { IsStringWithTrim } from '../../../../core/decorators/validation/is-string-with-trim';

export class CreateUserInputDto implements CreateUserDto {
    @IsStringWithTrim(loginConstraints.minLength, loginConstraints.maxLength)
    @IsNotEmpty()
    @Matches(loginConstraints.match)
    login: string;

    @IsString()
    @Length(passwordConstraints.minLength, passwordConstraints.maxLength)
    @Trim()
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsEmail()
    @Matches(emailConstraints.match)
    @Trim()
    @IsNotEmpty()
    email: string;
}