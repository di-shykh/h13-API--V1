import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {HydratedDocument, Model, Types} from "mongoose";
import {LikeStatus} from "../../likes/domain/likeStatus";
import {ExtendedLikeCreateDomainDto} from "../dto/extended-like-create.domain.dto";
import {ExtendedLikeInputDto} from "../api/input-dto/extended-like.input-dto";

@Schema({timestamps: true})
export class ExtendedLike {
    @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
    _id: Types.ObjectId;
    @Prop({type: String, required: true, min: 1})
    addedAt: string;
    @Prop({type: String, enum: LikeStatus, default: LikeStatus.none, required: true})
    status: LikeStatus;
    @Prop({type: String, required: true, min: 1})
    userId: string;
    @Prop({type: String, required: true})
    userLogin: string;
    @Prop({type: String, required: true, min: 1})
    postId: string;
    @Prop({ type: Date, default: null })
    deletedAt: Date | null;

    get id(){
        return this._id.toString() || '';
    }

    static createInstance(dto: ExtendedLikeCreateDomainDto): ExtendedLikeDocument {
        const like = new this();
        like.addedAt = new Date().toISOString();
        like.status = dto.status;
        like.userId = dto.userId;
        like.postId = dto.postId;
        like.userLogin = dto.userLogin;
        like.deletedAt = null;

        return like as ExtendedLikeDocument;
    }
    changeExtendedLikeStatus(dto: ExtendedLikeInputDto) : void {
        if(this.status === dto.likeStatus) return;
        this.status = dto.likeStatus;
    }
    makeDeleted() {
        this.deletedAt = new Date();
    }
}
export const ExtendedLikeSchema = SchemaFactory.createForClass(ExtendedLike);
ExtendedLikeSchema.loadClass(ExtendedLike);
ExtendedLikeSchema.virtual('id').get(function() {
    return this._id.toString();
});
export type ExtendedLikeDocument = HydratedDocument<ExtendedLike>;
export type ExtendedLikeModelType = Model<ExtendedLikeDocument> & typeof ExtendedLike;