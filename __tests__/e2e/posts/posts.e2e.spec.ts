import {HttpStatus, INestApplication} from "@nestjs/common";
import {CreateBlogInputDto} from "../../../src/modules/bloggers-platform/blogs/api/input-dto/blogs.input-dto";
import {
    CreatePostForBlogInputDto
} from "../../../src/modules/bloggers-platform/posts/api/input-dto/create-post-for-blog.input-dto";
import {generateBasicAuthToken} from "../../utils/auth-utils";
import {Test, TestingModule} from "@nestjs/testing";
import {AppModule} from "../../../src/app.module";
import {CreatePostInputDto} from "../../../src/modules/bloggers-platform/posts/api/input-dto/posts.input-dto";
import {createBlog} from "../../utils/blogs/create-blog";
import {BlogsViewDto} from "../../../src/modules/bloggers-platform/blogs/api/view-dto/blogs-view.dto";
import {
    ExtendedLikesInfoViewDto,
    PostViewDto
} from "../../../src/modules/bloggers-platform/posts/api/view-dto/posts.view-dto";
import {createPost} from "../../utils/posts/create-post";
import {getPostById} from "../../utils/posts/get-post-by-id";
import {LikeStatus} from "../../../src/modules/bloggers-platform/likes/domain/likeStatus";
import {PostUpdateDto} from "../../../src/modules/bloggers-platform/posts/dto/post-update.dto";
import {updatePost} from "../../utils/posts/update-post";
import request from "supertest";
import {POSTS_PATH} from "../../../src/core/paths/paths";
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
    const testPostData = {
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
    afterAll(async () => {
        await app.close();
    })
})