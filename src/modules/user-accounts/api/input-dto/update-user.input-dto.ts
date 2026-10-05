import {UpdateUserDto} from "../../dto/create-user.dto";
import {IsEmail, IsString, Matches} from 'class-validator';
import {emailConstraints} from "../../domain/user.entity";
import {Trim} from "../../../../core/decorators/transform/trim";

export class UpdateUserInputDto implements UpdateUserDto {
    @IsString()
    @IsEmail()
    @Matches(emailConstraints.match)
    @Trim()
    email: string;
}