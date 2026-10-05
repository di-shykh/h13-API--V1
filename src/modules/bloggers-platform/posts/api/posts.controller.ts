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
import {PostsQueryRepository} from "../infrastructure/query/posts.query-repository";
import {PostViewDto} from "./view-dto/posts.view-dto";
import {PostsService} from "../application/posts.service";
import {CreatePostInputDto} from "./input-dto/posts.input-dto";
import {PaginatedViewDto} from "../../../../core/dto/base.paginated.view-dto";
import {ApiParam} from "@nestjs/swagger";
import {PostUpdateDto} from "../dto/post-update.dto";
import {GetPotsQueryParams} from "./input-dto/get-posts-query-params.input-dto";
import {CommentViewDto} from "../../comments/api/view-dto/comments.view-dto";
import {GetCommentsQueryParams} from "../../comments/api/input-dto/get-comments-query-params.input-dto";
import {CommentsQueryRepository} from "../../comments/infrastructure/query/comments.query-repository";
import {BasicAuthGuard} from "../../../user-accounts/guards/basic/basic-auth.guard";

@Controller('posts')
export class PostsController {
    constructor(
        private postsService: PostsService,
        private postsQueryRepository: PostsQueryRepository,
        private commentsQueryRepository: CommentsQueryRepository,
    ) {
        console.log('PostsController created');
    }
    @ApiParam({ name: 'id' }) //для сваггера
    @Get(':id')
    async getPostById(@Param('id') id: string): Promise<PostViewDto> {
        return this.postsQueryRepository.getByIdOrNotFoundFail(id);
    }
    @Get()
    async getAllPosts(@Query() query: GetPotsQueryParams): Promise<PaginatedViewDto<PostViewDto[]>> {
        return this.postsQueryRepository.getAll(query);
    }
    @Post()
    @UseGuards(BasicAuthGuard)
    async createPost(
        @Body() postInputDto: CreatePostInputDto
    ): Promise<PostViewDto> {
        const postId = await this.postsService.createPost(postInputDto);
        return this.postsQueryRepository.getByIdOrNotFoundFail(postId);
    }
    @Put(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(BasicAuthGuard)
    async updatePost(
        @Param('id') id: string,
        @Body() postInputDto: PostUpdateDto,
    ): Promise<void> {
        return this.postsService.updatePost(id, postInputDto);
    }
    @Get(':postId/comments')
    async getComment(
        @Param('postId') postId: string,
        @Query() query: GetCommentsQueryParams
        ): Promise<PaginatedViewDto<CommentViewDto[]>> {
        return await this.commentsQueryRepository.getAllComments(query, postId);
    }
    @ApiParam({ name: 'id' }) //для сваггера
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(BasicAuthGuard)
    async deleteBlog(@Param('id') id: string): Promise<void> {
        return this.postsService.deletePost(id);
    }
}
