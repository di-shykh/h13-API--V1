import {InjectModel} from "@nestjs/mongoose";
import {Like, LikeDocument,type LikeModelType} from "../domain/like.entity";
import {Injectable, NotFoundException} from "@nestjs/common";
import {Types} from "mongoose";
import {LikeStatus} from "../domain/likeStatus";

@Injectable()
export class LikesRepository {
    constructor(@InjectModel(Like.name) private LikeModel: LikeModelType) {
    }

    async findById(id: string): Promise<LikeDocument | null> {
        const objectId = new Types.ObjectId(id);
        return this.LikeModel.findOne({
            _id: objectId,
            deletedAt: null,
        });
    }

    async save(like: LikeDocument): Promise<void> {
        await like.save();
    }

    async findByIdOrNotFoundFail(id: string): Promise<LikeDocument> {
        const like = await this.findById(id);
        if (!like) {
            throw new NotFoundException('Like not found');
        }
        return like;
    }

    async findLikeByUserIdAndParentId(userId: string, parentId: string): Promise<LikeDocument | null> {
        const result = await this.LikeModel.findOne({
            authorId: userId,
            parentId: parentId,
        });
        return result;
    }
    async countByParentAndStatus(parentId: string, status: LikeStatus): Promise<number> {
        return this.LikeModel.countDocuments({
            where: {
                parentId: parentId,
                status: status,
            }
        });
    }
}