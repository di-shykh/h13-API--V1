import {CommentUpdateDto} from "../../dto/comment-update.dto";
import {CommandHandler, ICommandHandler} from "@nestjs/cqrs";
import {CommentsRepository} from "../../infrastructure/comments.repository";
import {DomainExceptionCode} from "../../../../../core/exceptions/domain-exception-codes";
import {DomainException} from "../../../../../core/exceptions/domain-exceptions";

export class UpdateCommentCommand {
    constructor(
        public readonly commentId: string,
        public readonly dto: CommentUpdateDto,
        public readonly userId: string,
    ) {}
}

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentHandler implements ICommandHandler<UpdateCommentCommand> {
    constructor(
        private commentRepository: CommentsRepository,
    ) {}
    async execute(command: UpdateCommentCommand): Promise<void> {
        const comment = await this.commentRepository.findByIdOrNotFoundFail(command.commentId);
        if (!comment) {
            throw new DomainException({
                code: DomainExceptionCode.NotFound,
                message: `Could not find comment with id ${command.commentId}`,
                extensions: [
                    { message: 'Could not find comment', field: 'commentId' }
                ]
            })
        }
        if (comment.userId !== command.userId) {
            throw new DomainException({
                code: DomainExceptionCode.Forbidden,
                message: `Forbidden: ${comment.userId}`,
                extensions: [
                    { message: 'Forbidden', field: 'userId' }
                ]
            })
        }
        comment.updateComment(command.dto);
        await this.commentRepository.save(comment);
    }
}