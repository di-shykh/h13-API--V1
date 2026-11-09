import {LikeStatus} from "../../../likes/domain/likeStatus";
import {CommandHandler, ICommandHandler} from "@nestjs/cqrs";
import {InjectModel} from "@nestjs/mongoose";
import {CommentsRepository} from "../../infrastructure/comments.repository";
import {DomainException} from "../../../../../core/exceptions/domain-exceptions";
import {DomainExceptionCode} from "../../../../../core/exceptions/domain-exception-codes";
import {LikesRepository} from "../../../likes/infrastructure/likes.repository";
import {Like, type LikeModelType} from "../../../likes/domain/like.entity";

export class UpdateCommentLikeStatusCommand {
    constructor(
        public readonly userId: string,
        public readonly commentId: string,
        public readonly likeStatus: LikeStatus,
    ) {}
}

@CommandHandler(UpdateCommentLikeStatusCommand)
export class UpdateCommentLikeStatusHandler implements ICommandHandler<UpdateCommentLikeStatusCommand> {
    constructor(
        @InjectModel(Like.name) private likeModel: LikeModelType,
        private commentRepository: CommentsRepository,
        private likesRepository: LikesRepository,
    ) {
    }

    async execute(command: UpdateCommentLikeStatusCommand): Promise<void> {
        const comment = await this.commentRepository.findByIdOrNotFoundFail(command.commentId);
        if (!comment) {
            throw new DomainException({
                code: DomainExceptionCode.NotFound,
                message: `Could not find comment with id ${command.commentId}`,
                extensions: [
                    {message: 'Could not find comment', field: 'commentId'}
                ]
            })
        }
        if (!Object.values(LikeStatus).includes(command.likeStatus)) {
            throw new DomainException({
                code: DomainExceptionCode.BadRequest,
                message: `LikeStatus isn\'t valid!`,
                extensions: [
                    {message: 'LikeStatus isn\'t valid!', field: 'likeStatus'}
                ]
            })
        }
        const exitingLike = await this.likesRepository.findLikeByUserIdAndParentId(
            command.userId,
            command.commentId
        );
        if (command.likeStatus === LikeStatus.none) {
            if (exitingLike) {
                exitingLike.makeDeleted();
                await this.likesRepository.save(exitingLike);
            }
        } else {
            if (exitingLike) {
                exitingLike.changeStatus({likeStatus: command.likeStatus});
                exitingLike.deletedAt = null;
                await this.likesRepository.save(exitingLike);
            } else {
                const like = this.likeModel.createInstance({
                    createdAt: new Date(),
                    status: command.likeStatus,
                    authorId: command.userId,
                    parentId: command.commentId
                });
                await this.likesRepository.save(like);
            }
        }
        const likesCount = await this.likesRepository.countByParentAndStatus(command.commentId, LikeStatus.like);
        const dislikesCount = await this.likesRepository.countByParentAndStatus(command.commentId, LikeStatus.dislike);
        comment.updateLikeCount(likesCount, dislikesCount);
        await this.commentRepository.save(comment);
    }
}