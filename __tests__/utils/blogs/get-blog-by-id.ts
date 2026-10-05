import {BlogsViewDto} from "../../../src/modules/bloggers-platform/blogs/api/view-dto/blogs-view.dto";
import {HttpStatus, INestApplication} from "@nestjs/common";
import request from "supertest";
import {BLOGS_PATH} from "../../../src/core/paths/paths";
import {generateBasicAuthToken} from "../auth-utils";

export async function getBlogById(
    app: INestApplication,
    blogId: string
): Promise<BlogsViewDto | null> {
    const blogResponse = await request(app.getHttpServer())
        .get(`${BLOGS_PATH}/${blogId}`)
        .set('Authorization', generateBasicAuthToken())
        .expect(HttpStatus.OK);

    return blogResponse.body;
}