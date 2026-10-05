import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {HydratedDocument, Model, Types} from "mongoose";
import {CreateCommentDomainDto} from "../dto/comment-create.domain.dto";
import {CommentUpdateDto} from "../dto/comment-update.dto";

@Schema({timestamps: true})
export class Comment {
    @Prop({type: Types.ObjectId, default: ()=>new Types.ObjectId()})
    _id: string;
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
}
export const CommentSchema = SchemaFactory.createForClass(Comment);
CommentSchema.loadClass(Comment);
CommentSchema.virtual('id').get(function () {
    return this._id.toString();
})
export type CommentDocument = HydratedDocument<Comment>;
export type CommentModelType = Model<CommentDocument> & typeof Comment;