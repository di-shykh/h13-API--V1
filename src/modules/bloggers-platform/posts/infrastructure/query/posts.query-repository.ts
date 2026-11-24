import {Post, type PostModelType} from "../../domain/post.entity";
import {InjectModel} from "@nestjs/mongoose";
import {PostViewDto} from "../../api/view-dto/posts.view-dto";
import {Injectable, NotFoundException} from "@nestjs/common";
import {PaginatedViewDto} from "../../../../../core/dto/base.paginated.view-dto";
import {GetPotsQueryParams} from "../../api/input-dto/get-posts-query-params.input-dto";
import {Types} from "mongoose";
import {sk} from "date-fns/locale/sk";
import {LikeStatus} from "../../../likes/domain/likeStatus";
import {ExtendedLike, type ExtendedLikeModelType} from "../../../likes/domain/extendedLike.entity";

@Injectable()
export class PostsQueryRepository {
    constructor(
        @InjectModel(Post.name) private PostModel: PostModelType,
        @InjectModel(ExtendedLike.name) private ExtendedLikeModel: ExtendedLikeModelType,
    ) {}
    async getByIdOrNotFoundFail(id: string, userId?: string): Promise<PostViewDto> {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('Post not found');   // или DomainException(NotFound)
        }
        const objectId = new Types.ObjectId(id);
        const post= await this.PostModel.findOne({
            _id: objectId,
            deletedAt: null,
        });
        if (!post) {
            throw new NotFoundException('Post not found');
        }
        let myStatus = LikeStatus.none;
        if(userId) {
            const like = await this.ExtendedLikeModel.findOne({
                userId: userId,
                postId: id,
            });
            if(like) {
                myStatus = like.status;
            }
        }
        return PostViewDto.mapToView(post, myStatus);
    }
    async getAll(query: GetPotsQueryParams, userId?: string): Promise<PaginatedViewDto<PostViewDto[]>> {
        //todo спросить про FilterQuery
        const filter: any = {
            deletedAt: null,
        };

        const pageNumber = Number(query.pageNumber) || 1;
        const pageSize = Number(query.pageSize) || 10;
        const sortBy = query.sortBy || 'createdAt';
        const sortDirection = query.sortDirection === 'asc' ? 'asc' : 'desc';
        const searchPostTitleTerm = query.searchPostTitleTerm || null;

        const skip = (pageNumber - 1) * pageSize;

        if(query.searchPostTitleTerm){
            filter.$or = filter.$or||[];
            filter.$or.push({
                title: { $regex: searchPostTitleTerm, $options: "i" },
            });
        }
        const posts = await this.PostModel.find(filter)
            .sort({ [sortBy]: sortDirection })
            .skip(skip)
            .limit(pageSize);
        const totalCount = await this.PostModel.countDocuments(filter);
        let likesMap = new Map<string, LikeStatus>();
        if(userId && posts.length>0) {
            const postsIds = posts.map(post => post._id.toString());
            const extendexLikes = await this.ExtendedLikeModel.find({
                userId: userId,
                postId: {$in: postsIds},
                deletedAt: null,
            }).lean();
            extendexLikes.forEach(like => {
                likesMap.set(like.postId, like.status);
            });
        }
        const items = posts.map( post => {
            const myStatus = likesMap.get(post._id.toString())|| LikeStatus.none;
            return PostViewDto.mapToView(post, myStatus);
        });
        return PaginatedViewDto.mapToView( {
            items,
            totalCount,
            page: pageNumber,
            size: pageSize
        });
    }
    async getPostsByBlogId(blogId: string, query: GetPotsQueryParams, userId?: string): Promise<PaginatedViewDto<PostViewDto[]>> {
        const filter: any = {
            blogId: blogId,
            deletedAt: null,
        };

        const pageNumber = Number(query.pageNumber) || 1;
        const pageSize = Number(query.pageSize) || 10;
        const sortBy = query.sortBy || 'createdAt';
        const sortDirection = query.sortDirection === 'asc' ? 'asc' : 'desc';
        const searchPostTitleTerm = query.searchPostTitleTerm || null;

        const skip = (pageNumber - 1) * pageSize;

        if(query.searchPostTitleTerm){
            filter.$or = filter.$or||[];
            filter.$or.push({
                title: { $regex: searchPostTitleTerm, $options: "i" },
            })
        }
        const posts = await this.PostModel.find(filter)
            .sort({ [sortBy]: sortDirection })
            .skip(skip)
            .limit(pageSize);
        const totalCount = await this.PostModel.countDocuments(filter);
        let likesMap = new Map<string, LikeStatus>();
        if(userId && posts.length>0) {
            const postsIds = posts.map(post => post._id.toString());
            const extendedLikes = await this.ExtendedLikeModel.find({
                userId: userId,
                postId: {$in: postsIds},
                deletedAt: null,
            }).lean();
            extendedLikes.forEach(like => {
                likesMap.set(like.postId, like.status);
            });
        }
        const items = posts.map(post => {
            const myStatus = likesMap.get(post._id.toString())|| LikeStatus.none;
            return PostViewDto.mapToView(post, myStatus);
        });
        return PaginatedViewDto.mapToView( {
            items,
            totalCount,
            page: pageNumber,
            size: pageSize
        });
    }
}