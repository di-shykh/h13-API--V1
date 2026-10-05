import {PostViewDto} from "../../../src/modules/bloggers-platform/posts/api/view-dto/posts.view-dto";
import {HttpStatus, INestApplication} from "@nestjs/common";
import request from "supertest";

export async function getPostById(
    app: INestApplication,
    id: string
): Promise<PostViewDto | null> {
    const postResponse = await request(app.getHttpServer())
        .get(`/posts/${id}`)
        .expect(HttpStatus.OK);
    return postResponse.body;
}