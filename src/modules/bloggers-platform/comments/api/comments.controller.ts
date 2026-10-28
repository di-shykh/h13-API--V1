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
import {CommentsQueryRepository} from "../infrastructure/query/comments.query-repository";
import {CommentViewDto} from "./view-dto/comments.view-dto";
import {PaginatedViewDto} from "../../../../core/dto/base.paginated.view-dto";
import {ApiParam} from "@nestjs/swagger";
import {GetCommentsQueryParams} from "./input-dto/get-comments-query-params.input-dto";
import {CommentsService} from "../application/comments.service";
import {DomainException} from "../../../../core/exceptions/domain-exceptions";
import {DomainExceptionCode} from "../../../../core/exceptions/domain-exception-codes";
import {CurrentUserId} from "../../../user-accounts/guards/decorators/current-user-id.decorator";
import {JwtAuthGuard} from "../../../user-accounts/guards/bearer/jwt-auth.guard";
import {DeleteCommentCommand} from "../application/use-cases/delete-comment.use-case";
import { CommandBus } from '@nestjs/cqrs';
import {CommentInputDto} from "./input-dto/comment.input-dto";

@Controller('comments')
export class CommentsController {
   constructor(
       private commentsService: CommentsService,
       private commentsQueryRepository: CommentsQueryRepository,
       private commandBus: CommandBus,
   ) {
       console.log('CommentsController created');
   }
   @ApiParam({name: 'id'})
    @Get(':id')
    async getCommentById(
        @Param('id') id: string,
        @CurrentUserId() userId: string,
   ) {
       return  await this.commentsQueryRepository.getByIdOrNotFoundFail(id, userId ?? undefined);
   }
   @ApiParam({name: 'commentId'})
   @Delete(':commentId')
   @HttpCode(HttpStatus.NO_CONTENT)
   @UseGuards(JwtAuthGuard)
    async deleteComment(
        @Param('commentId') commentId: string,
        @CurrentUserId() userId: string,
    ) {
        return this.commandBus.execute(new DeleteCommentCommand(commentId, userId));
   }


}
