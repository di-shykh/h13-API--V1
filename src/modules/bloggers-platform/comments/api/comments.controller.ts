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
import {UpdateCommentCommand} from "../application/use-cases/update-comment.use-case";
import {CommentUpdateDto} from "../dto/comment-update.dto";
import {LikeStatus} from "../../likes/domain/likeStatus";
import {UpdateCommentLikeStatusCommand} from "../application/use-cases/update-comment-like-status.use-case";
import {LikeInputDto} from "../../likes/api/input-dto/like.input-dto";

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
   @ApiParam({name: 'commentId'})
    @Put(':commentId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuard)
    async updateComment(
        @Param('commentId') commentId: string,
        @CurrentUserId() userId: string,
        @Body() content: CommentUpdateDto,
   ){
       return this.commandBus.execute(new UpdateCommentCommand(commentId, content, userId));
   }
    @ApiParam({name: 'commentId'})
    @Put(':commentId/like-status')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuard)
    async updateLikeStatus(
        @Param('commentId') commentId: string,
        @CurrentUserId() userId: string,
        @Body() dto: LikeInputDto,
    ){
        return this.commandBus.execute(new UpdateCommentLikeStatusCommand(commentId, userId, dto.likeStatus));
    }
}
