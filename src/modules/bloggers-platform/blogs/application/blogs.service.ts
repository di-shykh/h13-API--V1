import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {Blog,type BlogModelType} from "../domain/blog.entity";
import {CreateBlogInputDto} from "../api/input-dto/blogs.input-dto";
import {BlogUpdateDto} from "../dto/blog-update.dto";
import {BlogsRepository} from "../infrastructure/blogs.repository";

@Injectable()
export class BlogsService {
    constructor(@InjectModel(Blog.name)
        private blogModel: BlogModelType,
        private blogsRepository: BlogsRepository,
    ) {}
    async createBlog(dto: CreateBlogInputDto): Promise<string> {
        const blog = this.blogModel.createInstance({
            name: dto.name,
            description: dto.description,
            websiteUrl: dto.websiteUrl,
        });
        await this.blogsRepository.save(blog);
        return  blog._id.toString();
    }
    async updateBlog(id: string, dto: BlogUpdateDto): Promise<void> {
        const blog = await this.blogsRepository.findByIdOrNotFoundFail(id);
        blog.update(dto);
        await this.blogsRepository.save(blog);
        return;
    }
    async deleteBlog(id: string): Promise<void> {
        const blog = await this.blogsRepository.findByIdOrNotFoundFail(id);
        blog.makeDeleted();
        await this.blogsRepository.save(blog);
        return;
    }
}
