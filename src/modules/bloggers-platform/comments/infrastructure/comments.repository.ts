import {InjectModel} from "@nestjs/mongoose";
import {Comment, CommentDocument,type CommentModelType} from "../domain/comment.entity";
import {Injectable, NotFoundException} from "@nestjs/common";
import {Types} from "mongoose";

@Injectable()
export class CommentsRepository {
    constructor(@InjectModel(Comment.name) private CommentModel: CommentModelType) {}
    async save(comment: CommentDocument): Promise<void> {
        await comment.save();
    }
    async findById(commentId: string): Promise<CommentDocument|null> {
        if (!Types.ObjectId.isValid(commentId)) {
            return null;
        }
        const objectId =  new Types.ObjectId(commentId);
        return this.CommentModel.findOne({
            _id: objectId,
            deletedAt: null,
        });
    }
    async deleteComment(commentId: string){
        if (!Types.ObjectId.isValid(commentId)) {
            return { modifiedCount: 0 };
        }
        const result = await this.CommentModel.updateOne(
            {_id: new Types.ObjectId(commentId)},
            {$set: {deletedAt: new Date()}},
        )
        return {deletedCount: result.modifiedCount};
    }
    async createComment(comment: CommentDocument): Promise<string> {
        const insertedComment = await this.CommentModel.create(comment);
        return insertedComment._id.toString();
    }
    async findByIdOrNotFoundFail(commentId: string): Promise<CommentDocument> {
        const comment = await this.findById(commentId);
        if (!comment) {
            throw new NotFoundException('Comment not found');
        }
        return comment;
    }
}
