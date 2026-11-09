import {HttpStatus, INestApplication} from "@nestjs/common";
import request from "supertest";
import {POSTS_PATH} from "../../../src/core/paths/paths";
import {CommentViewDto} from "../../../src/modules/bloggers-platform/comments/api/view-dto/comments.view-dto";
import {CommentInputDto} from "../../../src/modules/bloggers-platform/comments/api/input-dto/comment.input-dto";

export async function createComment(
    app: INestApplication,
    token: string,
    postId: string,
    commentDto: CommentInputDto,
): Promise<CommentViewDto> {
    const comment = await request(app.getHttpServer())
        .post(`${POSTS_PATH}/${postId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send(commentDto)
        .expect(HttpStatus.CREATED)
    return comment.body;
}
