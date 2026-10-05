import {HttpStatus, INestApplication} from "@nestjs/common";
import {CreateBlogDomainDto} from "../../src/modules/bloggers-platform/blogs/dto/blog-create.domain.dto";
import {BlogsViewDto} from "../../src/modules/bloggers-platform/blogs/api/view-dto/blogs-view.dto";
import request from "supertest";
import {BLOGS_PATH} from "../../src/core/paths/paths";

export function generateBasicAuthToken(
    username: string = process.env.AUTH_USERNAME ?? 'admin',
    password: string = process.env.AUTH_PASSWORD ?? 'qwerty',
): string {
    const credentials = `${username}:${password}`;
    return 'Basic ' + Buffer.from(credentials).toString('base64');
}
