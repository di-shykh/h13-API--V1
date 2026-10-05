import {HttpStatus, INestApplication, ValidationPipe} from "@nestjs/common";
import {CreateBlogInputDto} from "../../../src/modules/bloggers-platform/blogs/api/input-dto/blogs.input-dto";
import {
    CreatePostForBlogInputDto
} from "../../../src/modules/bloggers-platform/posts/api/input-dto/create-post-for-blog.input-dto";
import {generateBasicAuthToken} from "../../utils/auth-utils";
import {Test, TestingModule} from "@nestjs/testing";
import {AppModule} from "../../../src/app.module";
import request from "supertest";
import {POSTS_PATH} from "../../../src/core/paths/paths";
import {createBlog} from "../../utils/blogs/create-blog";
import {createPost} from "../../utils/posts/create-post";
import {getPostById} from "../../utils/posts/get-post-by-id";
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
    it('should not create post when incorrect body passed; POST /posts', async () => {
        await request(app.getHttpServer())
            .post(POSTS_PATH)
            .send({})
            .expect(HttpStatus.UNAUTHORIZED);

        const invalidDataSet1 = await request(app.getHttpServer())
            .post(POSTS_PATH)
            .set('Authorization', adminToken)
            .send({
                title: "    ",
                shortDescription: "     ",
                content: "   ",
                blogId: "  ",
            })
            .expect(HttpStatus.BAD_REQUEST);
        expect(invalidDataSet1.body.errorsMessages).toHaveLength(4);

        const invalidDataSet2 = await request(app.getHttpServer())
            .post(POSTS_PATH)
            .set('Authorization', adminToken)
            .send({
                title: "",
                shortDescription: "",
                content: "",
                blogId: "",
            })
            .expect(HttpStatus.BAD_REQUEST);
        expect(invalidDataSet2.body.errorsMessages).toHaveLength(4);

        const invalidDataSet3 = await request(app.getHttpServer())
            .post(POSTS_PATH)
            .set('Authorization', adminToken)
            .send({
                title: "A",
                shortDescription: "A",
                content: "A",
                blogId: "0",
            })
            .expect(HttpStatus.BAD_REQUEST);

        expect(invalidDataSet3.body.errorsMessages).toHaveLength(1);
        const postResponse = await request(app.getHttpServer())
            .get(POSTS_PATH)
            .set('Authorization', adminToken)
            .expect(HttpStatus.OK);

        expect(postResponse.body.items).toHaveLength(0);
    });
    it('should not update post when incorrect data passed; PUT /posts', async () => {
        const blog = await createBlog(app, adminToken, testBlogData);
        const createdPost = await createPost(app, adminToken, {...testPostData, blogId: blog.id});

        const invalidDataSet1 = await request(app.getHttpServer())
            .put(`${POSTS_PATH}/${createdPost.id}`)
            .set('Authorization', adminToken)
            .send({
                title: "    ",
                shortDescription: "     ",
                content: "   ",
                blogId: "  ",
            })
            .expect(HttpStatus.BAD_REQUEST);
        expect(invalidDataSet1.body.errorsMessages).toHaveLength(4);

        const invalidDataSet2 = await request(app.getHttpServer())
            .put(`${POSTS_PATH}/${createdPost.id}`)
            .set('Authorization', adminToken)
            .send({
                title: "",
                shortDescription: "",
                content: "",
                blogId: "",
            })
            .expect(HttpStatus.BAD_REQUEST);
        expect(invalidDataSet2.body.errorsMessages).toHaveLength(4);

        const invalidDataSet3 = await request(app.getHttpServer())
            .put(`${POSTS_PATH}/${createdPost.id}`)
            .set('Authorization', adminToken)
            .send({
                title: "A",
                shortDescription: "A",
                content: "A",
                blogId: "1000",
            })
            .expect(HttpStatus.BAD_REQUEST);
        expect(invalidDataSet3.body.errorsMessages).toHaveLength(1);

        const postResponse = await getPostById(app, createdPost.id);
        if(!postResponse){
            throw new Error("post was not found");
        }

        const blogName = postResponse.blogName;
        expect(postResponse).toEqual({
            ...createdPost,
            id: createdPost.id,
            title: createdPost.title,
            blogName: blogName,
        });
    })
    afterAll(async () => {
        await app.close();
    });
})