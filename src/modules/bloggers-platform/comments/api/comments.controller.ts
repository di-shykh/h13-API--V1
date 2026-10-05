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
    Query,
} from '@nestjs/common';
import {CommentsQueryRepository} from "../infrastructure/query/comments.query-repository";
import {CommentViewDto} from "./view-dto/comments.view-dto";
import {PaginatedViewDto} from "../../../../core/dto/base.paginated.view-dto";
import {ApiParam} from "@nestjs/swagger";
import {GetCommentsQueryParams} from "./input-dto/get-comments-query-params.input-dto";
import {CommentsService} from "../application/comments.service";

@Controller('comments')
export class CommentsController {
   constructor(
       private commentsService: CommentsService,
       private commentsQueryRepository: CommentsQueryRepository,
   ) {
       console.log('CommentsController created');
   }
   @ApiParam({name: 'id'})
    @Get(':id')
    async getCommentById(@Param('id') id: string) {
       return this.commentsQueryRepository.getByIdOrNotFoundFail(id);
   }
}
