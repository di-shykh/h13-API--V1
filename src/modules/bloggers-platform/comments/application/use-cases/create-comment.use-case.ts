import {CommandHandler, ICommandHandler} from "@nestjs/cqrs";
import {CommentsRepository} from "../../infrastructure/comments.repository";
import {DomainException} from "../../../../../core/exceptions/domain-exceptions";
import {DomainExceptionCode} from "../../../../../core/exceptions/domain-exception-codes";
import {CommentInputDto} from "../../api/input-dto/comment.input-dto";
import {PostsRepository} from "../../../posts/infrastructure/posts.repository";
import {PostDocument} from "../../../posts/domain/post.entity";
import {UsersRepository} from "../../../../user-accounts/infrastructure/users.repository";
import {InjectModel} from "@nestjs/mongoose";
import {CreateCommentDomainDto} from "../../dto/comment-create.domain.dto";
import { Comment } from '../../domain/comment.entity';
import type { CommentModelType } from '../../domain/comment.entity';

export class CreateCommentCommand {
    constructor(
        public readonly postId: string,
        public readonly userId: string,
        public readonly dto: CommentInputDto
    ) {}
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentHandler implements ICommandHandler<CreateCommentCommand> {
    constructor(
        @InjectModel(Comment.name) private commentModel: CommentModelType,
        private commentRepository: CommentsRepository,
        private postsRepository: PostsRepository,
        private usersRepository: UsersRepository
    ) {}
    async execute(command: CreateCommentCommand): Promise<string> {
        const post: PostDocument|null = await this.postsRepository.findByIdOrNotFoundFail(command.postId);
        if (!post) {
            throw new DomainException({
                code: DomainExceptionCode.NotFound,
                message: `Could not find post with id ${command.postId}`,
                extensions: [
                    { message: 'Could not find post', field: 'postId' }
                ]
            })
        }
        const user = await this.usersRepository.findOrNotFoundFail(command.userId);
        if (!user) {
            throw new DomainException({
                code: DomainExceptionCode.NotFound,
                message: `Could not find user with id ${command.userId}`,
                extensions: [
                    { message: 'Could not find user', field: 'userId' }
                ]
            })
        }
        const domainDto: CreateCommentDomainDto = {
            content: command.dto.content,
            postId: command.postId,
            commentatorInfo: {
                userId: command.userId,
                userLogin: user.login,
            }
        };
        const comment  = this.commentModel.createInstance(domainDto);
        await this.commentRepository.save(comment);
        return comment._id.toString();
    }
}


// export class CreateCommentDomainDto {
//     content: string;
//     postId: string;
//     commentatorInfo: {
//         userId: string;
//         userLogin: string;
//     }
// }