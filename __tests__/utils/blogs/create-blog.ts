import {CreateBlogDomainDto} from "../../../src/modules/bloggers-platform/blogs/dto/blog-create.domain.dto";
import {HttpStatus, INestApplication} from "@nestjs/common";
import {BlogsViewDto} from "../../../src/modules/bloggers-platform/blogs/api/view-dto/blogs-view.dto";
import request from "supertest";
import {BLOGS_PATH} from "../../../src/core/paths/paths";

export async function createBlog(
    app: INestApplication,
    token: string,
    blogData: CreateBlogDomainDto
): Promise<BlogsViewDto> {
    const response = await request(app.getHttpServer())
        .post(BLOGS_PATH)
        .set('Authorization', token)
        .send(blogData)
        .expect(HttpStatus.CREATED);
    return response.body;
}