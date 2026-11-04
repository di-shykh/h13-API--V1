import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {HydratedDocument, Model, Types} from "mongoose";
import {CreateCommentDomainDto} from "../dto/comment-create.domain.dto";
import {CommentUpdateDto} from "../dto/comment-update.dto";
import {LikeStatus} from "../../likes/domain/likeStatus";
import {LikeDocument} from "../../likes/domain/like.entity";

@Schema({timestamps: true})
export class Comment {
    @Prop({type: Types.ObjectId, default: ()=>new Types.ObjectId()})
    _id: Types.ObjectId;
    @Prop({type: String, required: true, min: 1})
    content: string;
    @Prop({type: String, required: true, min: 1})
    userId: string;
    @Prop({ type: String, required: true })
    userLogin: string;
    @Prop({type: String, required: true, min: 1})
    postId: string;
    @Prop({type: String, required: true, min: 1})
    createdAt: string;
    @Prop({type: Date, default: null})
    deletedAt: Date | null;
    @Prop({type: Number, required: true})
    likesCount: number;
    @Prop({type: Number, required: true})
    dislikesCount: number;
    @Prop({type: LikeStatus, required: true})
    myStatus: LikeStatus;

    get id() {
        return this._id?.toString();
    }

    static createInstance(dto: CreateCommentDomainDto): CommentDocument {
        const comment = new this();
        comment.content = dto.content;
        comment.userId = dto.commentatorInfo.userId;
        comment.userLogin = dto.commentatorInfo.userLogin;
        comment.postId = dto.postId;
        comment.createdAt = new Date().toISOString();
        comment.deletedAt = null;
        comment.likesCount = 0;
        comment.dislikesCount = 0;
        comment.myStatus = LikeStatus.none;

        return comment as CommentDocument;
    }
    makeDeleted() {
        if (this.deletedAt) {
            throw new Error('Comment already deleted');
        }
        this.deletedAt = new Date();
    }
    updateComment(dto: CommentUpdateDto) {
        this.content = dto.content;
    }
    updateLikeCount(likeCount: number, dislikeCount: number ): void {
        this.likesCount = likeCount;
        this.dislikesCount = dislikeCount;
    }
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
CommentSchema.loadClass(Comment);
CommentSchema.virtual('id').get(function () {
    return this._id.toString();
})
export type CommentDocument = HydratedDocument<Comment>;
export type CommentModelType = Model<CommentDocument> & typeof Comment;