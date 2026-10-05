import {IsString, Length, IsUrl, Matches, IsNotEmpty} from 'class-validator';
import {Trim} from "../../../../../core/decorators/transform/trim";

export class CreateBlogInputDto{
    @IsString()
    @IsNotEmpty()
    @Length(1, 15)
    @Trim()
    name: string;

    @IsString()
    @IsNotEmpty()
    @Length(1, 500)
    @Trim()
    description: string;

    @IsString()
    @IsNotEmpty()
    @IsUrl()
    @Length(1, 100)
    @Trim()
    @Matches(/^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/, {
        message: 'websiteUrl must match: https://example.com/',
    })
    websiteUrl: string;
}