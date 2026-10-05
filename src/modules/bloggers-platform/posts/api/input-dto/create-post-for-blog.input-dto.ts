import {IsNotEmpty, IsString, Length} from 'class-validator';
import {Trim} from "../../../../../core/decorators/transform/trim";

export class CreatePostForBlogInputDto  {
    @IsString()
    @IsNotEmpty()
    @Length(1, 30)
    @Trim()
    title: string;

    @IsString()
    @IsNotEmpty()
    @Length(1, 100)
    @Trim()
    shortDescription: string;

    @IsString()
    @IsNotEmpty()
    @Length(1, 30)
    @Trim()
    content: string;
}