import {HttpStatus, INestApplication} from "@nestjs/common";
import request from "supertest";
import {CommentViewDto} from "../../../src/modules/bloggers-platform/comments/api/view-dto/comments.view-dto";
import {COMMENTS_PATH} from "../../../src/core/paths/paths";

export async function getCommentById(
    app: INestApplication,
    id: string,
    token?: string
): Promise<CommentViewDto | null> {
    const req = request(app.getHttpServer()).get(`${COMMENTS_PATH}/${id}`);
    if (token) {
        req.set('Authorization', `Bearer ${token}`);
    }
    const commentResponse = await req.expect(HttpStatus.OK);
    return commentResponse.body;
}