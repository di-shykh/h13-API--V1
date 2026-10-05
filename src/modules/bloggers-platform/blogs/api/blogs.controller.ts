import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    Query, UseGuards,
} from '@nestjs/common';
import {BlogsQueryRepository} from "../infrastructure/query/blogs.query-repository";
import {BlogsViewDto} from "./view-dto/blogs-view.dto";
import {BlogsService} from "../application/blogs.service";
import {CreateBlogInputDto} from "./input-dto/blogs.input-dto";
import {PaginatedViewDto} from "../../../../core/dto/base.paginated.view-dto";
import {ApiParam} from "@nestjs/swagger";
import {BlogUpdateDto} from "../dto/blog-update.dto";
import {GetBlogsQueryParams} from "./input-dto/get-blogs-query-params.input-dto";
import {GetPotsQueryParams} from "../../posts/api/input-dto/get-posts-query-params.input-dto";
import {PostViewDto} from "../../posts/api/view-dto/posts.view-dto";
import {PostsQueryRepository} from "../../posts/infrastructure/query/posts.query-repository";
import {PostsService} from "../../posts/application/posts.service";
import {CreatePostInputDto} from "../../posts/api/input-dto/posts.input-dto";
import {CreatePostForBlogInputDto} from "../../posts/api/input-dto/create-post-for-blog.input-dto";
import {BasicAuthGuard} from "../../../user-accounts/guards/basic/basic-auth.guard";

@Controller('blogs')
export class BlogsController {
    constructor(
        private blogsQueryRepository: BlogsQueryRepository,
        private blogsService: BlogsService,
        private postsQueryRepository: PostsQueryRepository,
        private postsService: PostsService,
    ) {
        console.log('BlogsController created');
    }
    @ApiParam({ name: 'id' }) //для сваггера
    @Get(':id')
    async getBlogById(@Param('id') id: string): Promise<BlogsViewDto> {
        return this.blogsQueryRepository.getByIdOrNotFoundFail(id);
    }
    @Get()
    async getAllBlogs(
        @Query() query: GetBlogsQueryParams,
    ): Promise<PaginatedViewDto<BlogsViewDto[]>> {
        return this.blogsQueryRepository.getAll(query);
    }
    @Post()
    @UseGuards(BasicAuthGuard)
    async createBlog(
        @Body() blogInputDto: CreateBlogInputDto,
    ): Promise<BlogsViewDto> {
      const blogId = await this.blogsService.createBlog(blogInputDto);
      return this.blogsQueryRepository.getByIdOrNotFoundFail(blogId);
    }
    @Put(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(BasicAuthGuard)
    async updateBlog(
        @Param('id') id: string,
        @Body() body: BlogUpdateDto,
    ): Promise<void> {
        return this.blogsService.updateBlog(id, body);
    }
    @ApiParam({ name: 'id' }) //для сваггера
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(BasicAuthGuard)
    async deleteBlog(@Param('id') id: string): Promise<void> {
        return this.blogsService.deleteBlog(id);
    }
    @Get(':blogId/posts')
    async getPostsByBlogId(
        @Param('blogId') blogId: string,
        @Query() query: GetPotsQueryParams
    ): Promise<PaginatedViewDto<PostViewDto[]>> {
        await this.blogsQueryRepository.getByIdOrNotFoundFail(blogId);
        return this.postsQueryRepository.getPostsByBlogId(blogId, query);
    }
    @Post(':blogId/posts')
    @UseGuards(BasicAuthGuard)
    async createPostForBlog(
        @Param('blogId') blogId: string,
        @Body() postInputDto: CreatePostForBlogInputDto,
    ): Promise<PostViewDto> {
        await this.blogsQueryRepository.getByIdOrNotFoundFail(blogId);
        const postId: string = await this.postsService.createPostForBlog(blogId, postInputDto);
        return await this.postsQueryRepository.getByIdOrNotFoundFail(postId);
    }
}
