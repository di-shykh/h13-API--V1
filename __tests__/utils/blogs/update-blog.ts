import {HttpStatus, INestApplication} from "@nestjs/common";
import {BlogsViewDto} from "../../../src/modules/bloggers-platform/blogs/api/view-dto/blogs-view.dto";
import request from "supertest";
import {BLOGS_PATH} from "../../../src/core/paths/paths";
import {BlogUpdateDto} from "../../../src/modules/bloggers-platform/blogs/dto/blog-update.dto";

export async function updateBlog(
    app: INestApplication,
    token: string,
    blogData: BlogUpdateDto,
    blogId: string,
): Promise<void> {
    const response = await request(app.getHttpServer())
        .put(`${BLOGS_PATH}/${blogId}`)
        .set('Authorization', token)
        .send(blogData)
        .expect(HttpStatus.NO_CONTENT);
}