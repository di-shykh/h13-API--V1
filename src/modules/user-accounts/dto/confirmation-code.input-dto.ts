import {IsNotEmpty, IsString, Length} from 'class-validator';

export class ConfirmationCodeInputDto {
    @IsString()
    @IsNotEmpty()
    @Length(36, 36)
    code: string;
}