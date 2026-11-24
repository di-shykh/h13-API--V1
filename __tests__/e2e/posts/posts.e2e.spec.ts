import {HttpStatus, INestApplication} from "@nestjs/common";
import {CreateBlogInputDto} from "../../../src/modules/bloggers-platform/blogs/api/input-dto/blogs.input-dto";
import {generateBasicAuthToken} from "../../utils/auth-utils";
import {createBlog} from "../../utils/blogs/create-blog";
import {BlogsViewDto} from "../../../src/modules/bloggers-platform/blogs/api/view-dto/blogs-view.dto";
import {PostViewDto} from "../../../src/modules/bloggers-platform/posts/api/view-dto/posts.view-dto";
import {createPost} from "../../utils/posts/create-post";
import {getPostById} from "../../utils/posts/get-post-by-id";
import {LikeStatus} from "../../../src/modules/bloggers-platform/likes/domain/likeStatus";
import {PostUpdateDto} from "../../../src/modules/bloggers-platform/posts/dto/post-update.dto";
import {updatePost} from "../../utils/posts/update-post";
import request from "supertest";
import {COMMENTS_PATH, POSTS_PATH} from "../../../src/core/paths/paths";
import {clearDatabase, initApp} from "../../helpers/app-helper";
import {CommentViewDto} from "../../../src/modules/bloggers-platform/comments/api/view-dto/comments.view-dto";
import {getCommentById} from "../../utils/comments/get-comment-by-id";
import {UserViewDto} from "../../../src/modules/user-accounts/api/view-dto/user.view-dto";
import {createUser} from "../../utils/users/create-user";
import {signTestToken} from "../../utils/auth/sign-test-token";

describe('PostController (e2e)', () => {
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
    it('should create post POST /posts' , async () => {
        const blog: BlogsViewDto = await createBlog(app, adminToken, testBlogData);
        const post: PostViewDto = await createPost(app, adminToken, {
            ...testPostData,
            blogId: blog.id,
        });

        const postResponse: PostViewDto | null = await getPostById(app, post.id);
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
                newestLikes: [],
            },
        });
    });
    it('should return post by id; GET /posts/:id', async () => {
        const blog: BlogsViewDto = await createBlog(app, adminToken, testBlogData);
        const post: PostViewDto = await createPost(app, adminToken, {
            ...testPostData,
            blogId: blog.id,
        });
        if(!post) {
            throw new Error('Post was not created');
        }
        const postResponse = await getPostById(app, post.id);
        expect(postResponse).toMatchObject({
            id: expect.any(String),
            title: testPostData.title,
            shortDescription: testPostData.shortDescription,
            content: testPostData.content,
            blogId: blog.id,
        });
        expect(postResponse).toEqual(post);
    });
    it('should return posts list GET /posts', async() =>{
        const delayMs = 100;
        for(let i=1; i <= 25; i++){
            const postData = {
                title: `Post_${i}`,
                shortDescription: `description post_${i}`,
                content: `constent post_${i}`,
            }
            const blog = await createBlog(app, adminToken, testBlogData);
            const post = await createPost(app, adminToken, {
                ...postData,
                blogId: blog.id,
            });
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        const response = await request(app.getHttpServer())
            .get(`${POSTS_PATH}`)
            .expect(HttpStatus.OK);

        expect(response.body).toEqual({
            pagesCount: 3,
            page: 1,
            pageSize: 10,
            totalCount: 25,
            items: expect.any(Array),
        })
        expect(response.body.items).toHaveLength(10);
        const items = response.body.items;
        for (let i = 0; i < items.length - 1; i++) {
            const current = new Date(items[i].createdAt).getTime();
            const next = new Date(items[i + 1].createdAt).getTime();
            expect(current).toBeGreaterThanOrEqual(next);
        }
        expect(items[0].title).toBe('Post_25');
    },15000);
    it('should update post; PUT /posts/:id', async () => {
        const blog: BlogsViewDto = await createBlog(app, adminToken, testBlogData);
        const post: PostViewDto = await createPost(app, adminToken, {
            ...testPostData,
            blogId: blog.id,
        });
        const postUpdateData: PostUpdateDto = {
            title: 'Another post title',
            shortDescription: 'Post description another',
            content: 'another post content',
            blogId: post.blogId,
        }
        await updatePost(app, adminToken, post.id, postUpdateData);
        const postResponse = await getPostById(app, post.id);
        if (!postResponse) {
            throw new Error('Post was not found');
        }
        expect(postResponse).toEqual({
            ...postUpdateData,
            id: postResponse.id,
            blogName: postResponse.blogName,
            createdAt: postResponse.createdAt,
            extendedLikesInfo: {
                likesCount: expect.any(Number),
                dislikesCount: expect.any(Number),
                myStatus: expect.any(String),
                newestLikes: expect.any(Array),
            }
        });
    });
    it('DELETE /posts/:id -> should delete post and return 404 on subsequent GET', async () => {
        const blog: BlogsViewDto = await createBlog(app, adminToken, testBlogData);
        const post: PostViewDto = await createPost(app, adminToken, {
            ...testPostData,
            blogId: blog.id,
        });

        const createdPost = await getPostById(app, post.id);
        expect(createdPost).not.toBeNull();

        await request(app.getHttpServer())
            .delete(`${POSTS_PATH}/${post.id}`)
            .set('Authorization', adminToken)
            .expect(HttpStatus.NO_CONTENT);

        await request(app.getHttpServer())
            .get(`${POSTS_PATH}/${post.id}`)
            .set('Authorization', adminToken)
            .expect(HttpStatus.NOT_FOUND);
    })
    it('DELETE /posts/:id -> should return 401 without authorization', async () => {
        const blog = await createBlog(app, adminToken, testBlogData);
        const post = await createPost(app, adminToken, { ...testPostData, blogId: blog.id });

        await request(app.getHttpServer())
            .delete(`${POSTS_PATH}/${post.id}`)
            .expect(HttpStatus.UNAUTHORIZED);
    });
    describe('should update like-status for post PUT /posts/:postId/like-status', () => {
        it('should update like-status for post PUT /posts/:postId/like-status', async () => {
            const blog: BlogsViewDto = await createBlog(app, adminToken, testBlogData);
            const post: PostViewDto = await createPost(app, adminToken, {
                ...testPostData,
                blogId: blog.id,
            });

            await request(app.getHttpServer())
                .put(`${POSTS_PATH}/${post.id}/like-status`)
                .set('Authorization', `Bearer ${userAccessToken}`)
                .send({likeStatus: LikeStatus.like})
                .expect(HttpStatus.NO_CONTENT);

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
                    likesCount: 1,
                    dislikesCount: 0,
                    myStatus: LikeStatus.like,
                    newestLikes: [
                        {
                            addedAt: expect.any(String),
                            userId: testUserId,
                            login: user.login,
                        }
                    ]
                }
            });

            await request(app.getHttpServer())
                .put(`${POSTS_PATH}/${post.id}/like-status`)
                .set('Authorization', `Bearer ${userAccessToken}`)
                .send({likeStatus: LikeStatus.dislike})
                .expect(HttpStatus.NO_CONTENT);

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
                    dislikesCount: 1,
                    myStatus: LikeStatus.dislike,
                    newestLikes: [],
                }
            });

            await request(app.getHttpServer())
                .put(`${POSTS_PATH}/${post.id}/like-status`)
                .set('Authorization', `Bearer ${userAccessToken}`)
                .send({likeStatus: LikeStatus.none})
                .expect(HttpStatus.NO_CONTENT);

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
                    newestLikes: [],
                }
            });
        });
        it('should not update like-status for post with invalid token PUT /posts/:postId/like-status (401)', async () => {
            const invalidToken = 'invalid-token';
            const blog: BlogsViewDto = await createBlog(app, adminToken, testBlogData);
            const post: PostViewDto = await createPost(app, adminToken, {
                ...testPostData,
                blogId: blog.id,
            });
            await request(app.getHttpServer())
                .put(`${POSTS_PATH}/${post.id}/like-status`)
                .set('Authorization', `Bearer ${invalidToken}`)
                .send({likeStatus: LikeStatus.like})
                .expect(HttpStatus.UNAUTHORIZED);

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
        })
        it('should not update like-status for post with invalid id PUT /posts/:postId/like-status (404)', async () => {
            const invalidPostId = 'invalid-post-id';
            const blog: BlogsViewDto = await createBlog(app, adminToken, testBlogData);
            const post: PostViewDto = await createPost(app, adminToken, {
                ...testPostData,
                blogId: blog.id,
            });

            await request(app.getHttpServer())
                .put(`${POSTS_PATH}/${invalidPostId}/like-status`)
                .set('Authorization', `Bearer ${userAccessToken}`)
                .send({likeStatus: LikeStatus.like})
                .expect(HttpStatus.NOT_FOUND);

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
        })
    })
    afterAll(async () => {
        await app.close();
    });
})