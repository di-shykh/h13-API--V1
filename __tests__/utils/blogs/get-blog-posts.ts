import {HttpStatus, INestApplication} from "@nestjs/common";
import {PostViewDto} from "../../../src/modules/bloggers-platform/posts/api/view-dto/posts.view-dto";
import request from "supertest";
import {BLOGS_PATH} from "../../../src/core/paths/paths";

export async function getBlogPosts(
    app: INestApplication,
    blogId: string
) {
    const posts = await request(app.getHttpServer())
        .get(`${BLOGS_PATH}/${blogId}/posts`)
        .expect(HttpStatus.OK);
    return posts.body;
}