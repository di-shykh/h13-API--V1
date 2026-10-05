import {PostUpdateDto} from "../../../src/modules/bloggers-platform/posts/dto/post-update.dto";
import {HttpStatus, INestApplication} from "@nestjs/common";
import request from "supertest";
import {POSTS_PATH} from "../../../src/core/paths/paths";

export async function updatePost(
    app: INestApplication,
    adminToken: string,
    postId: string,
    dto: PostUpdateDto
): Promise<void> {
    const response = await request(app.getHttpServer())
        .put(`${POSTS_PATH}/${postId}`)
        .set('Authorization', adminToken)
        .send(dto)
        .expect(HttpStatus.NO_CONTENT);
}