import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {HydratedDocument, Model, Types} from 'mongoose';

@Schema({timestamps: true})
export class RateLimit {
    @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
    _id: Types.ObjectId;
    @Prop({type: String, required: true, min: 2})
    ip: string;
    @Prop({type: String, required: true, min: 1})
    url: string;
    @Prop({type: Date, required: true, default: Date.now()})
    date: Date;

    get id() {
        return this._id?.toString() || '';
    }
}
export const RateLimitSchema  = SchemaFactory.createForClass(RateLimit);
RateLimitSchema.index({ date: 1 }, { expires: 10 });
RateLimitSchema.index({ ip: 1, url: 1, date: -1 });
RateLimitSchema.virtual('id').get(function() {
    return this._id.toString();
})
RateLimitSchema.loadClass(RateLimit);
export type RateLimitDocument = HydratedDocument<RateLimit>;
export type RateLimitModelType = Model<RateLimitDocument> & typeof RateLimit;
