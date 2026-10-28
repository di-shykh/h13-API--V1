import {CommandHandler, ICommandHandler} from "@nestjs/cqrs";
import {CommentsRepository} from "../../infrastructure/comments.repository";
import {DomainException} from "../../../../../core/exceptions/domain-exceptions";
import {DomainExceptionCode} from "../../../../../core/exceptions/domain-exception-codes";

export class DeleteCommentCommand {
    constructor(
        public readonly commentId: string,
        public readonly userId: string,) {
    }
}

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentHandler implements ICommandHandler <DeleteCommentCommand> {
    constructor(private commentsRepository: CommentsRepository) {}
    async execute(command: DeleteCommentCommand): Promise<void> {
        const {commentId, userId} = command;
        const comment = await this.commentsRepository.findByIdOrNotFoundFail(commentId);
        if(!comment) {
            throw new DomainException({
                code: DomainExceptionCode.NotFound,
                message: `Could not find comment with id ${commentId}`,
                extensions: [
                    { message: 'Could not find comment', field: 'commentId' }
                ]
            })
        }
        if(comment.userId !== userId) {
            throw new DomainException({
                code: DomainExceptionCode.Forbidden,
                message: `Forbidden: ${comment.userId}`,
                extensions: [
                    { message: 'Forbidden', field: 'userId' }
                ]
            })
        }
        const result = await this.commentsRepository.deleteComment(commentId);
        if(result.deletedCount<1) {
            throw new DomainException({
                code: DomainExceptionCode.NotFound,
                message: `Could not find comment with id ${commentId}`,
                extensions: [
                    { message: 'Could not find comment', field: 'commentId' }
                ]
            })
        }
    }
}