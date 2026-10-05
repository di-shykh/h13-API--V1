import {InjectModel} from "@nestjs/mongoose";
import {Post, PostDocument,type PostModelType} from "../domain/post.entity";
import {Injectable, NotFoundException} from "@nestjs/common";
import {Types} from "mongoose";

@Injectable()
export class PostsRepository {
    constructor(@InjectModel(Post.name) private PostModel: PostModelType) {}
    async findById(id: string): Promise<PostDocument|null> {
        const objectId = new Types.ObjectId(id);
        return this.PostModel.findOne({
            _id: objectId,
            deletedAt: null,
        });
    }
    async save(post: PostDocument): Promise<void> {
        await post.save();
    }
    async findByIdOrNotFoundFail(id: string): Promise<PostDocument> {
        const post = await this.findById(id);
        if (!post) {
            throw new NotFoundException('Post not found');
        }
        return post;
    }
}