import {CommandHandler, ICommandHandler} from "@nestjs/cqrs";
import {DomainExceptionCode} from "../../../../../core/exceptions/domain-exception-codes";
import {DomainException} from "../../../../../core/exceptions/domain-exceptions";
import {ExtendedLikeInputDto} from "../../../likes/api/input-dto/extended-like.input-dto";
import {PostsRepository} from "../../infrastructure/posts.repository";
import {ExtendedLikesRepository} from "../../../likes/infrastructure/extended-likes.repository";
import {LikeStatus} from "../../../likes/domain/likeStatus";
import {InjectModel} from "@nestjs/mongoose";
import {ExtendedLike, type ExtendedLikeModelType} from "../../../likes/domain/extendedLike.entity";
import {ExtendedLikeCreateDomainDto} from "../../../likes/dto/extended-like-create.domain.dto";
import {UsersRepository} from "../../../../user-accounts/infrastructure/users.repository";

export class PostUpdateLikeStatusCommand {
    constructor(
        public readonly postId: string,
        public readonly userId: string,
        public readonly dto: ExtendedLikeInputDto,
    ) {}
}

@CommandHandler(PostUpdateLikeStatusCommand)
export class PostUpdateLikeStatusHandler implements ICommandHandler<PostUpdateLikeStatusCommand> {
    constructor(
       private postsRepository: PostsRepository,
       private usersRepository: UsersRepository,
       private extendedLikesRepository: ExtendedLikesRepository,
       @InjectModel(ExtendedLike.name) private extendedLikeModel: ExtendedLikeModelType,
    ) {}
    async execute(command: PostUpdateLikeStatusCommand): Promise<void> {
        let post = await this.postsRepository.findByIdOrNotFoundFail(command.postId);
        if (!post) {
            throw new DomainException({
                code: DomainExceptionCode.NotFound,
                message: `Could not find post with id ${command.postId}`,
                extensions: [
                    { message: 'Could not find post', field: 'postId' }
                ]
            })
        }
        if(!Object.values(LikeStatus).includes(command.dto.likeStatus)) {
            throw new DomainException({
                code: DomainExceptionCode.BadRequest,
                message: `LikeStatus isn\'t valid!`,
                extensions: [
                    { message: 'LikeStatus isn\'t valid!', field: 'likeStatus' }
                ]
            })
        }
        let like = await this.extendedLikesRepository.findLikeByUserIdAndPostId(command.userId,command.postId);
        if (!like && command.dto.likeStatus !== LikeStatus.none) {
            const user = await this.usersRepository.findById(command.userId);
            const dto: ExtendedLikeCreateDomainDto = {
                addedAt: new Date().toISOString(),
                status: command.dto.likeStatus,
                userId: command.userId,
                userLogin: user!.login,
                postId: command.postId
            }
            like = this.extendedLikeModel.createInstance(dto)
            await this.extendedLikesRepository.save(like);
        }
        else if (like){
            like.changeExtendedLikeStatus(command.dto);
            await this.extendedLikesRepository.save(like);
        }
        const likesCount = await this.extendedLikesRepository.countByParentAndStatus(command.postId, LikeStatus.like);
        const dislikesCount = await this.extendedLikesRepository.countByParentAndStatus(command.postId, LikeStatus.dislike);
        const newestLikes = await this.extendedLikesRepository.findLastExtendedLikesByPostId(command.postId);
        post.updateExtendedLikesInfo(likesCount, dislikesCount, like?.status ?? LikeStatus.none, newestLikes)
        await this.postsRepository.save(post);
    }
}
