import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {HydratedDocument, Model, Types} from "mongoose";
import {LikeStatus} from "../../likes/domain/likeStatus";
import {CreateLikeDomainDto} from "../dto/like-create.domain.dto";
import {LikeUpdateDto} from "../dto/like-update.dto";

@Schema({timestamps: true})
export class Like {
    @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
    _id: Types.ObjectId;
    @Prop({type: Date, default: Date.now, required: true})
    createdAt: Date;
    @Prop({type: String, enum: LikeStatus, default: LikeStatus.none, required: true})
    status: LikeStatus;
   @Prop({type: String,required: true, min: 1})
    authorId: string;
    @Prop({type: String,required: true, min: 1})
    parentId: string;
    @Prop({ type: Date, default: null })
    deletedAt: Date | null;

    get id(){
        return this._id.toString() || '';
    }

    static createInstance(dto: CreateLikeDomainDto): LikeDocument {
        const like = new this();
        like.createdAt = new Date();
        like.status = dto.status;
        like.authorId = dto.authorId;
        like.parentId = dto.parentId;
        like.deletedAt = null;

        return like as LikeDocument;
    }
    changeStatus(dto: LikeUpdateDto) {
        if(this.status === dto.likeStatus) return;
        this.status = dto.likeStatus;
    }
    makeDeleted() {
        this.deletedAt = new Date();
    }
}
export const LikeSchema = SchemaFactory.createForClass(Like);
LikeSchema.loadClass(Like);
LikeSchema.virtual('id').get(function() {
    return this._id.toString();
});
export type LikeDocument = HydratedDocument<Like>;
export type LikeModelType = Model<LikeDocument> & typeof Like;