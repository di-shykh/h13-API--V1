import {Comment, type CommentModelType} from "../../domain/comment.entity";
import {InjectModel} from "@nestjs/mongoose";
import {CommentViewDto} from "../../api/view-dto/comments.view-dto";
import {Injectable, NotFoundException} from "@nestjs/common";
import {PaginatedViewDto} from "../../../../../core/dto/base.paginated.view-dto";
import {GetCommentsQueryParams} from "../../api/input-dto/get-comments-query-params.input-dto";
import {Like, LikeDocument, type LikeModelType} from "../../../likes/domain/like.entity";
import {LikeStatus} from "../../../likes/domain/likeStatus";
import {BaseQueryParams} from "../../../../../core/dto/base.query-params.input-dto";
import {CommentSortField} from "../../api/input-dto/comment-sort-by";
import {Types} from "mongoose";

@Injectable()
export class CommentsQueryRepository {
    constructor(
        @InjectModel(Comment.name) private CommentModel: CommentModelType,
        @InjectModel(Like.name) private LikeModel: LikeModelType,
    ) {}
    async getByIdOrNotFoundFail(id: string, userId?: string): Promise<CommentViewDto> {
        const comment = await this.CommentModel.findOne({
            _id: id,
            deletedAt: null,
        });
        if (!comment) {
            throw new NotFoundException("Comment not found");
        }
        let like: LikeDocument | null = null;
        if(userId) {
            like = await this.LikeModel.findOne({
                authorId: userId,
                parentId: comment._id.toString(),
                deletedAt: null,
            });
        }
        let likeStatus = LikeStatus.none;
        if(like) {
            likeStatus = like.status;
        }
        return CommentViewDto.mapToView(comment, likeStatus);
    }
    async getAllComments(query: GetCommentsQueryParams, postId: string, userId?: string): Promise<PaginatedViewDto<CommentViewDto[]>> {
        const filter: any = {
            postId: postId,
            deletedAt: null,
        }
        if(query.searchContentTerm) {
            filter.$or = filter.$or||[];
            filter.$or.push({
                content: { $regex: query.searchContentTerm, $options: "i"}
            })
        }
        if (query.userId) {
            filter.userId = query.userId;
        }
        if (query.userLogin) {
            filter.userLogin = query.userLogin;
        }
        if (query.createdAt) {
            filter.createdAt= query.createdAt;
        }
        const comments = await this.CommentModel.find(filter)
            .sort({[query.sortBy]: query.sortDirection})
            .skip(query.calculateSkip())
            .limit(query.pageSize);
        const totalCount = await this.CommentModel.countDocuments(filter);
        let likesMap = new Map<string, LikeStatus>();
        if(userId && comments.length > 0){
            const commentsIds = comments.map(comment => comment._id.toString());
            const likes = await this.LikeModel.find({
                authorId: userId,
                parentId: {$in: commentsIds},
                deletedAt: null,
            }).lean();
            likes.forEach(like => {
                likesMap.set(like.parentId, like.status);
            });
        }
        const items = comments.map(comment => {
            const myStatus = likesMap.get(comment._id.toString())|| LikeStatus.none;
            return CommentViewDto.mapToView(comment, myStatus);
        });
        return PaginatedViewDto.mapToView({
            items,
            totalCount,
            page: query.pageNumber,
            size: query.pageSize
        });
    }
}