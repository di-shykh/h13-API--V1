import {IsString, Length, IsNotEmpty} from 'class-validator';
import {Trim} from "../../../../core/decorators/transform/trim";

export class CommentUpdateDto {
    @IsString()
    @IsNotEmpty()
    @Length(20, 300)
    @Trim()
    content: string;
}