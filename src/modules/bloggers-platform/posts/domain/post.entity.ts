import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {HydratedDocument, Model, Types} from "mongoose";
import {CreatePostDomainDto} from "../dto/post-create.domain.dto";
import {PostUpdateDto} from "../dto/post-update.dto";
import {LikeStatus} from "../../likes/domain/likeStatus";
import {ExtendedLikesInfo, ExtendedLikesInfoSchema} from "../../likes/domain/extendedLikesInfo.schema";
import {LikeInfo} from "../../likes/domain/likeInfo.schema";

@Schema({timestamps:true})
export class Post{
    @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
    _id: Types.ObjectId;
    @Prop({type: String, required: true, min: 1 })
    title: string;
    @Prop({type: String, required: true, min: 1 })
    shortDescription: string;
    @Prop({type: String, required: true, min: 1 })
    content: string;
    @Prop({type: String, required: true, min: 1 })
    blogId: string;
    @Prop({type: String, required: true, min: 1 })
    blogName: string;
    @Prop({type: String, required: true })
    createdAt: string;
    @Prop({ type: Date, default: null })
    deletedAt: Date | null;
    @Prop({type: ExtendedLikesInfoSchema, required: true, default: ()=>({})})
    extendedLikesInfo: ExtendedLikesInfo;

    get id(){
        return this._id?.toString() || '';
    }

    static createInstance(dto: CreatePostDomainDto): PostDocument {
        const post = new this();
        post.title = dto.title;
        post.shortDescription = dto.shortDescription;
        post.blogId = dto.blogId;
        post.blogName = dto.blogName;
        post.content = dto.content;
        post.createdAt = new Date().toISOString();
        post.deletedAt = null;
        post.extendedLikesInfo = {
            likesCount: 0,
            dislikesCount: 0,
            myStatus: LikeStatus.none,
            newestLikes: [],
        }
        return post as PostDocument;
    }
    makeDeleted(){
        if(this.deletedAt){
            throw new Error('Post already deleted');
        }
        this.deletedAt = new Date();
    }
    update(dto: PostUpdateDto){
        this.title = dto.title;
        this.shortDescription = dto.shortDescription;
        this.content = dto.content;
        this.blogId = dto.blogId;
    }
    updateExtendedLikesInfo(likesCount: number, dislikesCount: number, myStatus: LikeStatus, newestLikes: LikeInfo[]){
        this.extendedLikesInfo.likesCount = likesCount;
        this.extendedLikesInfo.dislikesCount = dislikesCount;
        this.extendedLikesInfo.newestLikes = newestLikes;
        this.extendedLikesInfo.myStatus = myStatus;
    }
}
export const PostSchema = SchemaFactory.createForClass(Post);
PostSchema.loadClass(Post);
// Добавляем индексы для быстрых запросов
PostSchema.index({ deletedAt: 1 });
PostSchema.index({ blogId: 1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ title: 'text' });
// Виртуальное поле id
PostSchema.virtual('id').get(function() {
    return this._id.toString();
});
export type PostDocument = HydratedDocument<Post>;
export type PostModelType = Model<PostDocument> & typeof Post;