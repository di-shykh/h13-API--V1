import {HttpStatus, INestApplication} from "@nestjs/common";
import {generateBasicAuthToken} from "../../utils/auth-utils";
import {LikeStatus} from "../../../src/modules/bloggers-platform/likes/domain/likeStatus";
import request from "supertest";
import {clearDatabase, initApp} from "../../helpers/app-helper";
import {CreateBlogInputDto} from "../../../src/modules/bloggers-platform/blogs/api/input-dto/blogs.input-dto";
import {CreatePostDomainDto} from "../../../src/modules/bloggers-platform/posts/dto/post-create.domain.dto";
import {CreatePostInputDto} from "../../../src/modules/bloggers-platform/posts/api/input-dto/posts.input-dto";
import {CommentInputDto} from "../../../src/modules/bloggers-platform/comments/api/input-dto/comment.input-dto";
import {BlogsViewDto} from "../../../src/modules/bloggers-platform/blogs/api/view-dto/blogs-view.dto";
import {createBlog} from "../../utils/blogs/create-blog";
import {createPost} from "../../utils/posts/create-post";
import {PostViewDto} from "../../../src/modules/bloggers-platform/posts/api/view-dto/posts.view-dto";
import {createComment} from "../../utils/comments/create-comment";
import {createUser} from "../../utils/users/create-user";
import {signTestToken} from "../../utils/auth/sign-test-token";
import {UserViewDto} from "../../../src/modules/user-accounts/api/view-dto/user.view-dto";
import {CommentViewDto} from "../../../src/modules/bloggers-platform/comments/api/view-dto/comments.view-dto";
import {getCommentById} from "../../utils/comments/get-comment-by-id";
import {COMMENTS_PATH, POSTS_PATH} from "../../../src/core/paths/paths";

describe('CommentsController (e2e) body-validation', () => {
    let app: INestApplication;
    let userAccessToken: string;
    let user: UserViewDto;
    let testUserId: string;

    const testBlogData: CreateBlogInputDto = {
        name: 'new blog',
        description: 'description',
        websiteUrl: 'https://someurl.com',
    };
    const testPostData = {
        title: 'Blog_Post Title',
        shortDescription: 'description blog_post',
        content: 'constent blog_post',
    };
    const testCommentData: CommentInputDto = {
        content: 'comment test content',
    }
    const testUserData = {login: 'TestUser', password: 'password123', email: 'test@mail.ru'};
    const adminToken: string = generateBasicAuthToken();

    beforeAll(async () => {
        app = await initApp();
    });
    beforeEach(async () => {
        await clearDatabase(app);
        user = await createUser(app, adminToken, testUserData);
        testUserId = user.id || (user as any)._id?.toString();

        userAccessToken = signTestToken(testUserId);
    });
    afterAll(async () => {
        if (app) await app.close();
    });
    it('should not create comment for post POST /posts/, (400)', async () => {
        const blog: BlogsViewDto = await createBlog(app, adminToken, testBlogData);
        const post: PostViewDto = await createPost(app, adminToken, {
            ...testPostData,
            blogId: blog.id,
        });
        await request(app.getHttpServer())
            .post(`${POSTS_PATH}/${post.id}/comments`)
            .set('Authorization', `Bearer ${userAccessToken}`)
            .send({content: ''})
            .expect(HttpStatus.BAD_REQUEST);

        await request(app.getHttpServer())
            .post(`${POSTS_PATH}/${post.id}/comments`)
            .set('Authorization', `Bearer ${userAccessToken}`)
            .send({content: 'fds'})
            .expect(HttpStatus.BAD_REQUEST);
        await request(app.getHttpServer())
            .post(`${POSTS_PATH}/${post.id}/comments`)
            .set('Authorization', `Bearer ${userAccessToken}`)
            .send({content: 'a'.repeat(301)})
            .expect(HttpStatus.BAD_REQUEST);
    });
    it('should not update comment PUT /comments/:commentId, (400)', async () => {
        const blog: BlogsViewDto = await createBlog(app, adminToken, testBlogData);
        const post: PostViewDto = await createPost(app, adminToken, {
            ...testPostData,
            blogId: blog.id,
        });
        const comment = await createComment(app, userAccessToken, post.id, testCommentData);
        const newContent = '';
        await request(app.getHttpServer())
            .put(`${COMMENTS_PATH}/${comment.id}`)
            .set('Authorization', `Bearer ${userAccessToken}`)
            .send({content: newContent})
            .expect(HttpStatus.BAD_REQUEST);

        await request(app.getHttpServer())
            .put(`${COMMENTS_PATH}/${comment.id}`)
            .set('Authorization', `Bearer ${userAccessToken}`)
            .send({content: '12'})
            .expect(HttpStatus.BAD_REQUEST);
        await request(app.getHttpServer())
            .put(`${COMMENTS_PATH}/${comment.id}`)
            .set('Authorization', `Bearer ${userAccessToken}`)
            .send({content: 'c'.repeat(301)})
            .expect(HttpStatus.BAD_REQUEST);

        const commentResponse: CommentViewDto | null = await getCommentById(app, comment.id);
        expect(commentResponse).toEqual({
            id: expect.any(String),
            content: testCommentData.content,
            createdAt: expect.any(String),
            likesInfo: {
                likesCount: 0,
                dislikesCount: 0,
                myStatus: LikeStatus.none,
            },
            commentatorInfo: {
                userId: testUserId,
                userLogin: user.login,
            },
        });
    });
    it('should not update comment PUT /comments/:commentId/like-status, (400)', async () => {
        const blog: BlogsViewDto = await createBlog(app, adminToken, testBlogData);
        const post: PostViewDto = await createPost(app, adminToken, {
            ...testPostData,
            blogId: blog.id,
        });
        const comment = await createComment(app, userAccessToken, post.id, testCommentData);

        await request(app.getHttpServer())
            .put(`${COMMENTS_PATH}/${comment.id}/like-status`)
            .set('Authorization', `Bearer ${userAccessToken}`)
            .send({likeStatus: ''})
            .expect(HttpStatus.BAD_REQUEST);

        await request(app.getHttpServer())
            .put(`${COMMENTS_PATH}/${comment.id}/like-status`)
            .set('Authorization', `Bearer ${userAccessToken}`)
            .send({likeStatus: 'invalidStatus'})
            .expect(HttpStatus.BAD_REQUEST);
    });
})