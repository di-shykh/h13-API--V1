import {HttpStatus, INestApplication} from "@nestjs/common";
import {CreatePostInputDto} from "../../../src/modules/bloggers-platform/posts/api/input-dto/posts.input-dto";
import {PostViewDto} from "../../../src/modules/bloggers-platform/posts/api/view-dto/posts.view-dto";
import request from "supertest";
import {POSTS_PATH} from "../../../src/core/paths/paths";

export async function createPost(
    app: INestApplication,
    token: string,
    postDto: CreatePostInputDto,
): Promise<PostViewDto> {
    const post = await request(app.getHttpServer())
        .post(POSTS_PATH)
        .set('Authorization', token)
        .send(postDto)
        .expect(HttpStatus.CREATED);
    return post.body;
}