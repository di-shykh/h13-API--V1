import {HttpStatus, INestApplication} from "@nestjs/common";
import {
    CreatePostForBlogInputDto
} from "../../../src/modules/bloggers-platform/posts/api/input-dto/create-post-for-blog.input-dto";
import {PostViewDto} from "../../../src/modules/bloggers-platform/posts/api/view-dto/posts.view-dto";
import request from "supertest";
import {BLOGS_PATH} from "../../../src/core/paths/paths";

export async function createBlogPost(
    app: INestApplication,
    token: string,
    blogId: string,
    postDto: CreatePostForBlogInputDto
): Promise<PostViewDto> {
    const response = await request(app.getHttpServer())
        .post(`${BLOGS_PATH}/${blogId}/posts`)
        .set('Authorization', token)
        .send(postDto)
        .expect(HttpStatus.CREATED);
    return response.body;
}