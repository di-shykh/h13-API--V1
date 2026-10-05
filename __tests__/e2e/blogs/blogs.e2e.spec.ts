import { Test, TestingModule } from '@nestjs/testing';
import {HttpStatus, INestApplication, ValidationPipe} from '@nestjs/common';
import request from 'supertest';
import {AppModule} from 'src/app.module';
import {generateBasicAuthToken} from "../../utils/auth-utils";
import {getBlogById} from "../../utils/blogs/get-blog-by-id";
import {createBlog} from "../../utils/blogs/create-blog";
import {BlogUpdateDto} from "../../../src/modules/bloggers-platform/blogs/dto/blog-update.dto";
import {CreateBlogInputDto} from "../../../src/modules/bloggers-platform/blogs/api/input-dto/blogs.input-dto";
import {updateBlog} from "../../utils/blogs/update-blog";
import {BLOGS_PATH} from "../../../src/core/paths/paths";
import {PostViewDto} from "../../../src/modules/bloggers-platform/posts/api/view-dto/posts.view-dto";
import {createBlogPost} from "../../utils/blogs/create-blog-post";
import {
    CreatePostForBlogInputDto
} from "../../../src/modules/bloggers-platform/posts/api/input-dto/create-post-for-blog.input-dto";
import {getPostById} from "../../utils/posts/get-post-by-id";
import {getBlogPosts} from "../../utils/blogs/get-blog-posts";
import { getConnectionToken } from '@nestjs/mongoose';
import {pipesSetup} from "../../../src/setup/pipes.setup";

describe('AppController', () => {
    let app: INestApplication;
    let moduleFixture: TestingModule | undefined;

    beforeAll(async () => {
        moduleFixture = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        pipesSetup(app);
        await app.init();
    });

    beforeEach(async () => {
        const connection  = moduleFixture!.get(getConnectionToken());
        const collections = connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    });
    const testBlogData: CreateBlogInputDto = {
        name: 'new blog',
        description: 'description',
        websiteUrl: 'https://someurl.com',
    }
    it('/(GET)', ()=>{
        return request(app.getHttpServer())
            .get('/')
            .expect(200)
            .expect('Hello World!');
    })
    it('POST /blogs -> should create a new blog', async ()=>{
       await createBlog(app, generateBasicAuthToken(), testBlogData);
    })
    it('should return blogs list: GET /blogs', async()=>{
        const delayMs = 100;
        for (let i=1; i <= 25; i++) {
            const blogData = {
                name: `Blog ${i}`,
                description: `Description ${i}`,
                websiteUrl: `https://blog${i}.com`,
            }
           const response = await createBlog(app, generateBasicAuthToken(), blogData);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        const response = await request(app.getHttpServer())
            .get(`${BLOGS_PATH}`)
            .expect(HttpStatus.OK)

        expect(response.body).toEqual({
            pagesCount: 3,
            page: 1,
            pageSize: 10,
            totalCount: 25,
            items: expect.any(Array),
        });
        expect(response.body.items).toHaveLength(10);
        for (const blog of response.body.items) {
            expect(blog).toEqual({
                id: expect.any(String),
                name: expect.any(String),
                description: expect.any(String),
                websiteUrl: expect.any(String),
                createdAt: expect.any(String),
                isMembership: false,
            });
        }
        const items = response.body.items;
        for (let i = 0; i < items.length - 1; i++) {
            const current = new Date(items[i].createdAt).getTime();
            const next = new Date(items[i + 1].createdAt).getTime();
            expect(current).toBeGreaterThanOrEqual(next);
        }
        expect(items[0].name).toBe('Blog 25');
    },15000)
    it('should return blog by id; GET /blogs/:id', async() =>{
        const createdBlog = await createBlog(app, generateBasicAuthToken(), testBlogData);
        const blog = await getBlogById(app, createdBlog.id);
        expect(blog).toEqual({
            ...createdBlog,
            id: expect.any(String),
            createdAt: expect.any(String),
        })
    })
    it('should update blog; PUT /blogs/:id', async() =>{
        const updatedBlog = await createBlog(app, generateBasicAuthToken(), testBlogData);
        const blogUpdateData: BlogUpdateDto = {
            name: "Updated name",
            description: "Updated description",
            websiteUrl: "https://www.updateblogs.com/",
        };
        await updateBlog(app, generateBasicAuthToken(), blogUpdateData, updatedBlog.id, );

        const blogResponse = await getBlogById(app, updatedBlog.id);
        expect(blogResponse).toEqual({
            ...blogUpdateData,
            id: updatedBlog.id,
            createdAt: expect.any(String),
            isMembership: expect.any(Boolean),
        })
    })
    it('DELETE /blogs/:id and check after NOT FOUND', async() =>{
        const token = generateBasicAuthToken();
        const createdBlog = await createBlog(app, token, testBlogData);

        const createdBlogResponse = await getBlogById(app, createdBlog.id);
        expect(createdBlogResponse).not.toBeNull();

        await request(app.getHttpServer())
            .delete(`${BLOGS_PATH}/${createdBlog.id}`)
            .set('Authorization', token)
            .expect(HttpStatus.NO_CONTENT);

        await request(app.getHttpServer())
            .get(`${BLOGS_PATH}/${createdBlog.id}`)
            .set('Authorization', token)
            .expect(HttpStatus.NOT_FOUND);
    })
    it('POST /blogs/{blogId}/posts', async() =>{
        const token = generateBasicAuthToken();
        const createdBlog = await createBlog(app, token, testBlogData);
        const blog = await getBlogById(app, createdBlog.id);
        const postData: CreatePostForBlogInputDto = {
            title: 'Blog_Post Title',
            shortDescription: 'description blog_post',
            content: 'constent blog_post',
        };
        if (!blog) {
            throw new Error('Blog was not created');
        }
        const createdPost: PostViewDto = await createBlogPost(app, token, blog.id, {
           ...postData
        });

        expect(createdPost).toEqual({
            id: expect.any(String),
            title: postData.title,
            shortDescription: postData.shortDescription,
            content: postData.content,
            blogId: blog.id,
            blogName: blog.name,
            createdAt: expect.any(String),
            extendedLikesInfo: {
                likesCount: expect.any(Number),
                dislikesCount: expect.any(Number),
                myStatus: expect.any(String),
                newestLikes: expect.any(Array),
            }
        });
        const fetchedPost = await getPostById(app, createdPost.id);
        expect(fetchedPost).toEqual(createdPost);
    })
    it('GET /blogs/{blogId}/posts', async() =>{
        const token = generateBasicAuthToken();
        const createdBlog = await createBlog(app, token, testBlogData);
        const blog = await getBlogById(app, createdBlog.id);
        if(!blog) {
            throw new Error('Blog was not created');
        }
        const postsData = [
            { title: 'Post 1', shortDescription: 'Desc 1', content: 'Content 1' },
            { title: 'Post 2', shortDescription: 'Desc 2', content: 'Content 2' },
            { title: 'Post 3', shortDescription: 'Desc 3', content: 'Content 3' },
        ];
        const createdPosts: PostViewDto[] = [];
        for(const postData of postsData) {
            const post = await createBlogPost(app, token, blog.id, postData);
            createdPosts.push(post);
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        const postResponse = await getBlogPosts(app, blog.id);

        expect(postResponse.totalCount).toBe(3);
        expect(postResponse.items).toHaveLength(3);
        for(const post of postResponse.items) {
            expect(post.blogId).toBe(blog.id);
            expect(post.blogName).toBe(blog.name);
        }
        expect(postResponse.items[0].title).toBe('Post 3');
        expect(postResponse.items[1].title).toBe('Post 2');
        expect(postResponse.items[2].title).toBe('Post 1');
    })
    afterAll(async () => {
        await app.close();
    })
})