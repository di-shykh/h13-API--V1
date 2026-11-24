import {PostViewDto} from "../../../src/modules/bloggers-platform/posts/api/view-dto/posts.view-dto";
import {HttpStatus, INestApplication} from "@nestjs/common";
import request from "supertest";
import {COMMENTS_PATH, POSTS_PATH} from "../../../src/core/paths/paths";

export async function getPostById(
    app: INestApplication,
    id: string,
    token?: string
): Promise<PostViewDto | null> {
    const req = request(app.getHttpServer()).get(`${POSTS_PATH}/${id}`);
    if (token) {
        req.set('Authorization', `Bearer ${token}`);
    }
    const postResponse = await req.expect(HttpStatus.OK);
    return postResponse.body;
}