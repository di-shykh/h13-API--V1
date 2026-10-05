import {Schema, Prop, SchemaFactory} from "@nestjs/mongoose";
import {HydratedDocument, Model, Types} from "mongoose";
import {CreateBlogDomainDto} from "../dto/blog-create.domain.dto";
import { BlogUpdateDto} from "../dto/blog-update.dto";

@Schema({timestamps:true})
export class Blog {
    @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
    _id: Types.ObjectId;
    @Prop({type: String, required: true, min: 1})
    name: string;
    @Prop({type: String, required: true, min: 1})
    description: string;
    @Prop({type: String, required: true, min: 1})
    websiteUrl: string;
    @Prop({type: String, required: true, min: 1})
    createdAt: string;
    @Prop({type: Boolean, required: true})
    isMembership: boolean;
    @Prop({ type: Date, default: null })
    deletedAt: Date | null;

    get id() {
        return this._id?.toString() || '';
    }

    static createInstance(dto: CreateBlogDomainDto): BlogDocument {
        const blog = new this();
        blog.name = dto.name;
        blog.description = dto.description;
        blog.websiteUrl = dto.websiteUrl;
        blog.createdAt = new Date().toISOString();
        blog.isMembership = false;
        blog.deletedAt = null;

        return blog as BlogDocument;
    }
    makeDeleted() {
        if(this.deletedAt) {
            throw new Error('Blog already deleted');
        }
        this.deletedAt = new Date();
    }
    update(dto: BlogUpdateDto ) {
        this.name = dto.name;
        this.description = dto.description;
        this.websiteUrl = dto.websiteUrl;
    }
}
export const BlogSchema = SchemaFactory.createForClass(Blog);
BlogSchema.loadClass(Blog);
// Виртуальное поле id
BlogSchema.virtual('id').get(function() {
    return this._id.toString();
});
export type BlogDocument = HydratedDocument<Blog>;
export type BlogModelType = Model<BlogDocument> & typeof Blog;