import {IsString, Length, IsNotEmpty, IsMongoId} from 'class-validator';
import {Trim} from "../../../../core/decorators/transform/trim";

export class PostUpdateDto {
    @IsString()
    @IsNotEmpty()
    @Length(1,30)
    @Trim()
    title: string;

    @IsString()
    @IsNotEmpty()
    @Length(1,100)
    @Trim()
    shortDescription: string;

    @IsString()
    @IsNotEmpty()
    @Length(1,1000)
    @Trim()
    content: string;

    @IsMongoId()
    blogId: string;
}