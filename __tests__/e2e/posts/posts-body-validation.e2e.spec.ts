import {HttpStatus, INestApplication} from "@nestjs/common";
import {CreateBlogInputDto} from "../../../src/modules/bloggers-platform/blogs/api/input-dto/blogs.input-dto";
import {
    CreatePostForBlogInputDto
} from "../../../src/modules/bloggers-platform/posts/api/input-dto/create-post-for-blog.input-dto";
import {generateBasicAuthToken} from "../../utils/auth-utils";
import request from "supertest";
import {POSTS_PATH} from "../../../src/core/paths/paths";
import {createBlog} from "../../utils/blogs/create-blog";
import {createPost} from "../../utils/posts/create-post";
import {getPostById} from "../../utils/posts/get-post-by-id";
import {clearDatabase, initApp} from "../../helpers/app-helper";
import {BlogsViewDto} from "../../../src/modules/bloggers-platform/blogs/api/view-dto/blogs-view.dto";
import {PostViewDto} from "../../../src/modules/bloggers-platform/posts/api/view-dto/posts.view-dto";
import {LikeStatus} from "../../../src/modules/bloggers-platform/likes/domain/likeStatus";
import {UserViewDto} from "../../../src/modules/user-accounts/api/view-dto/user.view-dto";
import {createUser} from "../../utils/users/create-user";
import {signTestToken} from "../../utils/auth/sign-test-token";

describe('AppController (e2e),body validation tests', () => {
    let app: INestApplication;
    let userAccessToken: string;
    let user: UserViewDto;
    let testUserId: string;


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
    const testUserData = { login: 'TestUser', password: 'password123', email: 'test@mail.ru' };
    const adminToken: string = generateBasicAuthToken();
    beforeAll(async () => {
        app = await initApp();
    });
    beforeEach(async () => {
        await clearDatabase(app);
        user = await createUser(app,adminToken, testUserData);
        testUserId = user.id || (user as any)._id?.toString();
        userAccessToken = signTestToken(testUserId);
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
    });
    it('should not update like-status for post with invalid like-status PUT /posts/:postId/like-status (404)', async () => {
        const invalidPostId = 'invalid-post-id';
        const blog: BlogsViewDto = await createBlog(app, adminToken, testBlogData);
        const post: PostViewDto = await createPost(app, adminToken, {
            ...testPostData,
            blogId: blog.id,
        });

        await request(app.getHttpServer())
            .put(`${POSTS_PATH}/${invalidPostId}/like-status`)
            .set('Authorization', `Bearer ${userAccessToken}`)
            .send({likeStatus: ''})
            .expect(HttpStatus.BAD_REQUEST);

        let postResponse: PostViewDto | null = await getPostById(app, post.id, userAccessToken);
        expect(postResponse).not.toBeNull();
        expect(postResponse).toEqual({
            id: expect.any(String),
            title: testPostData.title,
            shortDescription: testPostData.shortDescription,
            content: testPostData.content,
            blogId: blog.id,
            blogName: blog.name,
            createdAt: expect.any(String),
            extendedLikesInfo: {
                likesCount: 0,
                dislikesCount: 0,
                myStatus: LikeStatus.none,
                newestLikes: []
            }
        });

        await request(app.getHttpServer())
            .put(`${POSTS_PATH}/${invalidPostId}/like-status`)
            .set('Authorization', `Bearer ${userAccessToken}`)
            .send({likeStatus: 'inavlid-like-status'})
            .expect(HttpStatus.BAD_REQUEST);

        postResponse = await getPostById(app, post.id, userAccessToken);
        expect(postResponse).not.toBeNull();
        expect(postResponse).toEqual({
            id: expect.any(String),
            title: testPostData.title,
            shortDescription: testPostData.shortDescription,
            content: testPostData.content,
            blogId: blog.id,
            blogName: blog.name,
            createdAt: expect.any(String),
            extendedLikesInfo: {
                likesCount: 0,
                dislikesCount: 0,
                myStatus: LikeStatus.none,
                newestLikes: []
            }
        });
    })
    afterAll(async () => {
        await app.close();
    });
})