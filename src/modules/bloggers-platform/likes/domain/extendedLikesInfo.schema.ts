import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {LikeInfoSchema, LikeInfo} from "./likeInfo.schema";
import {LikeStatus} from "./likeStatus";

@Schema({_id: false})
export class ExtendedLikesInfo {
    @Prop({ type: Number, required: true, default: 0 })
    likesCount: number;

    @Prop({ type: Number, required: true, default: 0 })
    dislikesCount: number;

    @Prop({
        type: String,
        enum: LikeStatus,
        default: 'None'
    })
    myStatus: 'None' | 'Like' | 'Dislike';

    @Prop({ type: [LikeInfoSchema], default: [] })
    newestLikes: LikeInfo[];
}
export const ExtendedLikesInfoSchema = SchemaFactory.createForClass(ExtendedLikesInfo);