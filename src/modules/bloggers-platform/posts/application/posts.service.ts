import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {Post,type PostModelType} from "../domain/post.entity";
import {CreatePostInputDto} from "../api/input-dto/posts.input-dto";
import {PostUpdateDto} from "../dto/post-update.dto";
import {PostsRepository} from "../infrastructure/posts.repository";
import {BlogsRepository} from "../../blogs/infrastructure/blogs.repository";
import {CreatePostForBlogInputDto} from "../api/input-dto/create-post-for-blog.input-dto";
import {LikeStatus} from "../../likes/domain/likeStatus";

@Injectable()
export class PostsService {
    constructor(@InjectModel(Post.name)
                private postModel: PostModelType,
                private postsRepository: PostsRepository,
                private blogsRepository: BlogsRepository,
    ) {}
    async createPost(dto: CreatePostInputDto): Promise<string> {
        const blog = await this.blogsRepository.findByIdOrNotFoundFail(dto.blogId);
        const post = this.postModel.createInstance({
            title: dto.title,
            shortDescription: dto.shortDescription,
            content: dto.content,
            blogId: dto.blogId,
            blogName: blog.name,
            extendedLikesInfo: {
                likesCount: 0,
                dislikesCount: 0,
                myStatus: LikeStatus.none,
                newestLikes: [],
            }
        });
        await this.postsRepository.save(post);
        return post._id.toString();
    }
    async updatePost(id: string,dto: PostUpdateDto): Promise<void> {
        const post = await this.postsRepository.findByIdOrNotFoundFail(id);
        post.update(dto);
        await this.postsRepository.save(post);
        return;
    }
    async deletePost(id: string): Promise<void> {
        const post = await this.postsRepository.findByIdOrNotFoundFail(id);
        post.makeDeleted();
        await this.postsRepository.save(post);
        return;
    }
    async createPostForBlog(blogId: string, dto: CreatePostForBlogInputDto): Promise<string> {
        const blog = await this.blogsRepository.findByIdOrNotFoundFail(blogId);
        const post = this.postModel.createInstance({
            title: dto.title,
            shortDescription: dto.shortDescription,
            content: dto.content,
            blogId: blogId,
            blogName: blog.name,
            extendedLikesInfo: {
                likesCount: 0,
                dislikesCount: 0,
                myStatus: LikeStatus.none,
                newestLikes: [],
            }
        })
        await this.postsRepository.save(post);
        return post._id.toString();
    }
}