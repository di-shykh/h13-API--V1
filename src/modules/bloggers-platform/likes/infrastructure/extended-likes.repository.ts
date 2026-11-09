import {Injectable, NotFoundException} from "@nestjs/common";
import {Types} from "mongoose";
import {LikeStatus} from "../domain/likeStatus";
import {InjectModel} from "@nestjs/mongoose";
import {ExtendedLike, ExtendedLikeDocument, type ExtendedLikeModelType} from "../domain/extendedLike.entity";

@Injectable()
export class ExtendedLikesRepository {
    constructor(@InjectModel(ExtendedLike.name) private extendedLikeModel: ExtendedLikeModelType) {}

    async findById(id: string): Promise<ExtendedLikeDocument | null> {
        if(!Types.ObjectId.isValid(id)) {
            return null;
        }
        const objectId = new Types.ObjectId(id);
        return this.extendedLikeModel.findOne({
            _id: objectId,
            deletedAt: null,
        });
    }
    async save(extendedLike: ExtendedLikeDocument): Promise<void> {
        await extendedLike.save();
    }
    async findByIdOrFail(id: string): Promise<ExtendedLikeDocument> {
        const like = await this.findById(id);
        if (!like) {
            throw new NotFoundException('Like not found');
        }
        return like;
    }
    async findLikeByUserIdAndPostId(userId: string, postId: string): Promise<ExtendedLikeDocument | null> {
        return  this.extendedLikeModel.findOne({
            userId: userId,
            postId: postId,
            deletedAt: null,
        });
    }
    async countByParentAndStatus(postId: string, status: LikeStatus): Promise<number> {
        return this.extendedLikeModel.countDocuments({
                postId: postId,
                status: status,
                deletedAt: null,
        });
    }
    async findLastExtendedLikesByPostId(postId: string): Promise<ExtendedLikeDocument[]> {
        return this.extendedLikeModel.find({
            postId: postId,
            status: LikeStatus.like,
            deletedAt: null,
        })
        .sort({ addedAt: -1 })
        .limit(3);
    }
}