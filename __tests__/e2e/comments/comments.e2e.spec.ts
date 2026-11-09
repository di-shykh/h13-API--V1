import {HttpStatus, INestApplication} from "@nestjs/common";
import {generateBasicAuthToken} from "../../utils/auth-utils";
import {LikeStatus} from "../../../src/modules/bloggers-platform/likes/domain/likeStatus";
import request from "supertest";
import {clearDatabase, initApp} from "../../helpers/app-helper";
import {CreateBlogInputDto} from "../../../src/modules/bloggers-platform/blogs/api/input-dto/blogs.input-dto";
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

describe('CommentsController (e2e)', () => {
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
    afterAll(async () => {
        if (app) await app.close();
    });
    describe('should create comment for post POST /posts/', () => {
        it('should create comment for a post', async () => {
            const blog: BlogsViewDto = await createBlog(app, adminToken, testBlogData);
            const post: PostViewDto = await createPost(app, adminToken, {
                ...testPostData,
                blogId: blog.id,
            });
            const comment = await createComment(app, userAccessToken, post.id, testCommentData);
            const commentResponse: CommentViewDto | null = await getCommentById(app, comment.id);
            expect(commentResponse).not.toBeNull();
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
        it('should not create comment for a post with invalid token (401)', async () => {
            const blog: BlogsViewDto = await createBlog(app, adminToken, testBlogData);
            const post: PostViewDto = await createPost(app, adminToken, {
                ...testPostData,
                blogId: blog.id,
            });
            const invalidToken = 'invalid-token';
            const comment = await request(app.getHttpServer())
                .post(`${POSTS_PATH}/${post.id}/comments`)
                .set('Authorization', `Bearer ${invalidToken}`)
                .send(testCommentData)
                .expect(HttpStatus.UNAUTHORIZED);
        });
        it('should not create comment for a unexisting post (404)', async () => {
            const invalidPostId = 'invalid-post-id';
            const comment = await request(app.getHttpServer())
                .post(`${POSTS_PATH}/${invalidPostId}/comments`)
                .set('Authorization', `Bearer ${userAccessToken}`)
                .send(testCommentData)
                .expect(HttpStatus.NOT_FOUND);
        });
    })
    describe('should update comment PUT /comments/:commentId', ()=>{
        it('should update comment PUT /comments/:commentId, (204)', async () => {
            const blog: BlogsViewDto = await createBlog(app, adminToken, testBlogData);
            const post: PostViewDto = await createPost(app, adminToken, {
                ...testPostData,
                blogId: blog.id,
            });
            const comment = await createComment(app, userAccessToken, post.id, testCommentData);
            const newContent = 'new-content-string-for-test';
            await request(app.getHttpServer())
                .put(`${COMMENTS_PATH}/${comment.id}`)
                .set('Authorization', `Bearer ${userAccessToken}`)
                .send({content: newContent})
                .expect(HttpStatus.NO_CONTENT);

            const commentResponse: CommentViewDto | null = await getCommentById(app, comment.id);
            expect(commentResponse).toEqual({
                id: expect.any(String),
                content: newContent,
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
        it('should not update comment without token PUT /comments/:commentId, (401)', async () => {
            const blog: BlogsViewDto = await createBlog(app, adminToken, testBlogData);
            const post: PostViewDto = await createPost(app, adminToken, {
                ...testPostData,
                blogId: blog.id,
            });
            const invalidToken = 'invalid-token';
            const comment = await createComment(app, userAccessToken, post.id, testCommentData);
            const newContent = 'new-content-string-for-test';
            await request(app.getHttpServer())
                .put(`${COMMENTS_PATH}/${comment.id}`)
                .set('Authorization', `Bearer ${invalidToken}`)
                .send(testCommentData)
                .expect(HttpStatus.UNAUTHORIZED);
        });
        it('should not update comment that is not your own PUT /comments/:commentId, (403)', async () => {
            const blog: BlogsViewDto = await createBlog(app, adminToken, testBlogData);
            const post: PostViewDto = await createPost(app, adminToken, {
                ...testPostData,
                blogId: blog.id,
            });
            const comment = await createComment(app, userAccessToken, post.id, testCommentData);
            user = await createUser(app,adminToken, {
                ...testUserData,
                login: 'NewUser',
                email: 'newuser@mail.ru'});
            const newTestUserId = user.id || (user as any)._id?.toString();
            const newUserAccessToken = signTestToken(newTestUserId);
            await request(app.getHttpServer())
                .put(`${COMMENTS_PATH}/${comment.id}`)
                .set('Authorization', `Bearer ${newUserAccessToken}`)
                .send(testCommentData)
                .expect(HttpStatus.FORBIDDEN);
        });
        it('should not update comment invalid id PUT /comments/:commentId, (404)', async () => {
            const blog: BlogsViewDto = await createBlog(app, adminToken, testBlogData);
            const post: PostViewDto = await createPost(app, adminToken, {
                ...testPostData,
                blogId: blog.id,
            });
            const comment = await createComment(app, userAccessToken, post.id, testCommentData);
            const newContent = 'new-content-string-for-test';
            const invalidId = 'invalid-id';
            await request(app.getHttpServer())
                .put(`${COMMENTS_PATH}/${invalidId}`)
                .set('Authorization', `Bearer ${userAccessToken}`)
                .send({content: newContent})
                .expect(HttpStatus.NOT_FOUND);

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
    })
    describe('should delete comment DELETE /comments/:commentId', ()=>{
        it('should delete comment DELETE /comments/:commentId, (204)', async () => {
            const blog: BlogsViewDto = await createBlog(app, adminToken, testBlogData);
            const post: PostViewDto = await createPost(app, adminToken, {
                ...testPostData,
                blogId: blog.id,
            });
            const comment = await createComment(app, userAccessToken, post.id, testCommentData);

            await request(app.getHttpServer())
                .delete(`${COMMENTS_PATH}/${comment.id}`)
                .set('Authorization', `Bearer ${userAccessToken}`)
                .expect(HttpStatus.NO_CONTENT);

            await request(app.getHttpServer())
                .get(`${COMMENTS_PATH}/${comment.id}`)
                .expect(HttpStatus.NOT_FOUND);

        });
        it('should not delete comment without token DELETE /comments/:commentId, (401)', async () => {
            const blog: BlogsViewDto = await createBlog(app, adminToken, testBlogData);
            const post: PostViewDto = await createPost(app, adminToken, {
                ...testPostData,
                blogId: blog.id,
            });
            const invalidToken = 'invalid-token';
            const comment = await createComment(app, userAccessToken, post.id, testCommentData);
            await request(app.getHttpServer())
                .delete(`${COMMENTS_PATH}/${comment.id}`)
                .set('Authorization', `Bearer ${invalidToken}`)
                .expect(HttpStatus.UNAUTHORIZED);

            const commentResponse: CommentViewDto | null = await getCommentById(app, comment.id);
            expect(commentResponse).not.toBeNull();
        });
        it('should not delete comment that is not your own DELETE /comments/:commentId, (403)', async () => {
            const blog: BlogsViewDto = await createBlog(app, adminToken, testBlogData);
            const post: PostViewDto = await createPost(app, adminToken, {
                ...testPostData,
                blogId: blog.id,
            });
            const comment = await createComment(app, userAccessToken, post.id, testCommentData);
            user = await createUser(app,adminToken, {
                ...testUserData,
                login: 'NewUser',
                email: 'newuser@mail.ru'});
            const newTestUserId = user.id || (user as any)._id?.toString();
            const newUserAccessToken = signTestToken(newTestUserId);
            await request(app.getHttpServer())
                .delete(`${COMMENTS_PATH}/${comment.id}`)
                .set('Authorization', `Bearer ${newUserAccessToken}`)
                .expect(HttpStatus.FORBIDDEN);

            const commentResponse: CommentViewDto | null = await getCommentById(app, comment.id);
            expect(commentResponse).not.toBeNull();
        });
        it('should not delete comment invalid id DELETE /comments/:commentId, (404)', async () => {
            const blog: BlogsViewDto = await createBlog(app, adminToken, testBlogData);
            const post: PostViewDto = await createPost(app, adminToken, {
                ...testPostData,
                blogId: blog.id,
            });
            const comment = await createComment(app, userAccessToken, post.id, testCommentData);
            const invalidId = 'invalid-id';
            await request(app.getHttpServer())
                .delete(`${COMMENTS_PATH}/${invalidId}`)
                .set('Authorization', `Bearer ${userAccessToken}`)
                .expect(HttpStatus.NOT_FOUND);

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
    })
    describe('should get comment GET /comments/:commentId', () => {
        it('should get comment GET /comments/:commentId', async () => {
            const blog: BlogsViewDto = await createBlog(app, adminToken, testBlogData);
            const post: PostViewDto = await createPost(app, adminToken, {
                ...testPostData,
                blogId: blog.id,
            });
            const comment = await createComment(app, userAccessToken, post.id, testCommentData);
            const commentResponse: CommentViewDto | null = await getCommentById(app, comment.id);
            expect(commentResponse).not.toBeNull();
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
        it('should not get comment with invalid id (404)', async () => {
            const invalidCommentId = 'invalid-id';
            await request(app.getHttpServer())
                .get(`${COMMENTS_PATH}/${invalidCommentId}`)
                .expect(HttpStatus.NOT_FOUND);
        })
    });
    describe('should update like-status for comment PUT /comments/:commentId/like-status', () => {
        it('should update comment PUT /comments/:commentId/like-status', async () => {
            const blog: BlogsViewDto = await createBlog(app, adminToken, testBlogData);
            const post: PostViewDto = await createPost(app, adminToken, {
                ...testPostData,
                blogId: blog.id,
            });
            const comment = await createComment(app, userAccessToken, post.id, testCommentData);

            await request(app.getHttpServer())
                .put(`${COMMENTS_PATH}/${comment.id}/like-status`)
                .set('Authorization', `Bearer ${userAccessToken}`)
                .send({likeStatus: LikeStatus.like})
                .expect(HttpStatus.NO_CONTENT);

            let commentResponse: CommentViewDto | null = await getCommentById(app, comment.id, userAccessToken);
            expect(commentResponse).not.toBeNull();
            expect(commentResponse).toEqual({
                id: expect.any(String),
                content: testCommentData.content,
                createdAt: expect.any(String),
                likesInfo: {
                    likesCount: 1,
                    dislikesCount: 0,
                    myStatus: LikeStatus.like,
                },
                commentatorInfo: {
                    userId: testUserId,
                    userLogin: user.login,
                },
            });

            await request(app.getHttpServer())
                .put(`${COMMENTS_PATH}/${comment.id}/like-status`)
                .set('Authorization', `Bearer ${userAccessToken}`)
                .send({likeStatus: LikeStatus.dislike})
                .expect(HttpStatus.NO_CONTENT);

            commentResponse = await getCommentById(app, comment.id, userAccessToken);
            expect(commentResponse).not.toBeNull();
            expect(commentResponse).toEqual({
                id: expect.any(String),
                content: testCommentData.content,
                createdAt: expect.any(String),
                likesInfo: {
                    likesCount: 0,
                    dislikesCount: 1,
                    myStatus: LikeStatus.dislike,
                },
                commentatorInfo: {
                    userId: testUserId,
                    userLogin: user.login,
                },
            });

            await request(app.getHttpServer())
                .put(`${COMMENTS_PATH}/${comment.id}/like-status`)
                .set('Authorization', `Bearer ${userAccessToken}`)
                .send({likeStatus: LikeStatus.none})
                .expect(HttpStatus.NO_CONTENT);

            commentResponse = await getCommentById(app, comment.id, userAccessToken);
            expect(commentResponse).not.toBeNull();
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
        it('should not update comment PUT /comments/:commentId/like-status with invalid token (401)', async ()=>{
            const blog: BlogsViewDto = await createBlog(app, adminToken, testBlogData);
            const post: PostViewDto = await createPost(app, adminToken, {
                ...testPostData,
                blogId: blog.id,
            });
            const comment = await createComment(app, userAccessToken, post.id, testCommentData);
            const invalidToken = 'invalid-token';
            await request(app.getHttpServer())
                .put(`${COMMENTS_PATH}/${comment.id}/like-status`)
                .set('Authorization', `Bearer ${invalidToken}`)
                .send({likeStatus: LikeStatus.like})
                .expect(HttpStatus.UNAUTHORIZED);
        });
        it('should not update comment PUT /comments/:commentId/like-status with invalid commentId (404)', async ()=>{
            const blog: BlogsViewDto = await createBlog(app, adminToken, testBlogData);
            const post: PostViewDto = await createPost(app, adminToken, {
                ...testPostData,
                blogId: blog.id,
            });
            const comment = await createComment(app, userAccessToken, post.id, testCommentData);
            const invalidId = 'invalid-id';
            await request(app.getHttpServer())
                .put(`${COMMENTS_PATH}/${invalidId}/like-status`)
                .set('Authorization', `Bearer ${userAccessToken}`)
                .send({likeStatus: LikeStatus.like})
                .expect(HttpStatus.NOT_FOUND);
        });
    });
})