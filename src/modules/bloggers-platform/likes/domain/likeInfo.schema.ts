import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";

@Schema({_id: false})
export class LikeInfo {
    @Prop({ type: String, required: true })
    addedAt: string;

    @Prop({ type: String, required: true })
    userId: string;

    @Prop({ type: String, required: true })
    login: string;
}
export const LikeInfoSchema = SchemaFactory.createForClass(LikeInfo);
