import {IsNotEmpty, IsString, Length} from 'class-validator';
import {Trim} from "../../../../core/decorators/transform/trim";
import {passwordConstraints} from "../../domain/user.entity";

export class NewPasswordInputDto {
    @IsString()
    @Length(passwordConstraints.minLength, passwordConstraints.maxLength)
    @Trim()
    @IsNotEmpty()
    newPassword: string;

    @IsString()
    @Trim()
    @IsNotEmpty()
    recoveryCode: string;
}