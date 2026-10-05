import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {HydratedDocument, Model, Types} from "mongoose";
import {LikeStatus} from "../../likes/domain/likeStatus";

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

    get id(){
        return this._id.toString() || '';
    }
}
export const LikeSchema = SchemaFactory.createForClass(Like);
LikeSchema.loadClass(Like);
LikeSchema.virtual('id').get(function() {
    return this._id.toString();
});
export type LikeDocument = HydratedDocument<Like>;
export type LikeModelType = Model<LikeDocument> & typeof Like;