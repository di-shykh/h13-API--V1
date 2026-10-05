import {IsString, Length, IsUrl, Matches, IsNotEmpty} from 'class-validator';
import {Trim} from "../../../../core/decorators/transform/trim";

export class BlogUpdateDto {
    @IsString()
    @IsNotEmpty()
    @Length(1, 15)
    @Trim()
    name: string;
    //maxLength: 15
    @IsString()
    @IsNotEmpty()
    @Length(1, 500)
    @Trim()
    description: string;//maxLength: 500

    @IsString()
    @IsNotEmpty()
    @IsUrl()
    @Length(1, 100)
    @Trim()
    @Matches(/^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/, {
        message: 'websiteUrl must match: https://example.com/',
    })
    websiteUrl: string; //maxLength: 100  pattern: ^https://([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$
}