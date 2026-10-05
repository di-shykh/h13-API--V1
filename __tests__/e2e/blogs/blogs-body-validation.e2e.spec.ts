import { Test, TestingModule } from '@nestjs/testing';
import {HttpStatus, INestApplication, ValidationPipe} from '@nestjs/common';
import request from 'supertest';
import { AppModule } from "../../../src/app.module";
import {CreateBlogInputDto} from "../../../src/modules/bloggers-platform/blogs/api/input-dto/blogs.input-dto";
import {generateBasicAuthToken} from "../../utils/auth-utils";
import {BLOGS_PATH} from "../../../src/core/paths/paths";
import {createBlog} from "../../utils/blogs/create-blog";
import {createBlogPost} from "../../utils/blogs/create-blog-post";
import {
    CreatePostForBlogInputDto
} from "../../../src/modules/bloggers-platform/posts/api/input-dto/create-post-for-blog.input-dto";
import {getConnectionToken} from "@nestjs/mongoose";
import {pipesSetup} from "../../../src/setup/pipes.setup";

describe('AppController (e2e),body validation tests', () => {
    let app: INestApplication;
    let moduleFixture: TestingModule | undefined;
    const testBlogData: CreateBlogInputDto = {
        name: 'new blog',
        description: 'description',
        websiteUrl: 'https://someurl.com',
    };
    const testPostData: CreatePostForBlogInputDto = {
        title: 'Blog_Post Title',
        shortDescription: 'description blog_post',
        content: 'constent blog_post',
    };
    const adminToken: string = generateBasicAuthToken();
    beforeAll(async () => {
        moduleFixture = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        pipesSetup(app);
        await app.init();
    });
    beforeEach(async () => {
        const connection = moduleFixture!.get(getConnectionToken());
        const collections = connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    });
    it('should not create blog when incorrect body passed; POST /blogs', async () => {
        await request(app.getHttpServer())
            .post(BLOGS_PATH)
            .send(testBlogData)
            .expect(HttpStatus.UNAUTHORIZED);

        const invalidBody = await request(app.getHttpServer())
            .post(BLOGS_PATH)
            .set('Authorization', adminToken)
            .send({
                ...testBlogData,
                name: "    ",
                description: "     ",
                websiteUrl: "randomString",
            })
            .expect(HttpStatus.BAD_REQUEST);
        expect(invalidBody.body.errorsMessages).toHaveLength(3);

        const invalidBody2 = await request(app.getHttpServer())
            .post(BLOGS_PATH)
            .set('Authorization', adminToken)
            .send({
                ...testBlogData,
                name: "",
                description: "",
                websiteUrl: "",
            })
            .expect(HttpStatus.BAD_REQUEST);
        expect(invalidBody2.body.errorsMessages).toHaveLength(3);

        const invalidBody3 = await request(app.getHttpServer())
            .post(BLOGS_PATH)
            .set('Authorization', adminToken)
            .send({
                ...testBlogData,
                name: "A",
                description: "A",
                websiteUrl: "https://.com/",
            })
            .expect(HttpStatus.BAD_REQUEST);
        expect(invalidBody3.body.errorsMessages).toHaveLength(1);

        const blogResponse = await request(app.getHttpServer())
            .get(BLOGS_PATH)
            .expect(HttpStatus.OK);

        expect(blogResponse.body.items).toHaveLength(0);
    });
    it('should not update blog when incorrect data passed; PUT /blogs', async () => {
        const createdBlog  = await createBlog(app, adminToken, testBlogData);

        const invalidData = await request(app.getHttpServer())
            .put(`${BLOGS_PATH}/${createdBlog.id}`)
            .set('Authorization', adminToken)
            .send({
                ...testBlogData,
                name: "    ",
                description: "     ",
                websiteUrl: "randomString",
            })
            .expect(HttpStatus.BAD_REQUEST);
        expect(invalidData.body.errorsMessages).toHaveLength(3);

        const invalidData2 = await request(app.getHttpServer())
            .put(`${BLOGS_PATH}/${createdBlog.id}`)
            .set('Authorization', adminToken)
            .send({
                ...testBlogData,
                name: "",
                description: "",
                websiteUrl: "",
            })
            .expect(HttpStatus.BAD_REQUEST);
        expect(invalidData2.body.errorsMessages).toHaveLength(3);

        const invalidData3 = await request(app.getHttpServer())
            .put(`${BLOGS_PATH}/${createdBlog.id}`)
            .set('Authorization', adminToken)
            .send({
                ...testBlogData,
                name: "A",
                description: "A",
                websiteUrl: "https://.com/",
            })
            .expect(HttpStatus.BAD_REQUEST);
        expect(invalidData3.body.errorsMessages).toHaveLength(1);

        const blogResponse = await request(app.getHttpServer())
            .get(`${BLOGS_PATH}/${createdBlog.id}`)
            .expect(HttpStatus.OK);
        expect(blogResponse.body).toEqual({
            ...createdBlog,
        });
    });
    it('should not create post for blog with wrong blogId POST /blogId/posts', async () => {
        const wrongBlogId : string = 'randomString';
        try {
            await createBlogPost(app, adminToken, wrongBlogId, {
                ...testPostData,
            });
            fail('Post should not be created for wrong blogId')
        } catch (e) {
            expect(e).toBeDefined();
        }
    });
    afterAll(async () => {
        await app.close();
    });
})