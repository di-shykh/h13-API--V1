import {Post, type PostModelType} from "../../domain/post.entity";
import {InjectModel} from "@nestjs/mongoose";
import {PostViewDto} from "../../api/view-dto/posts.view-dto";
import {Injectable, NotFoundException} from "@nestjs/common";
import {PaginatedViewDto} from "../../../../../core/dto/base.paginated.view-dto";
import {GetPotsQueryParams} from "../../api/input-dto/get-posts-query-params.input-dto";
import {Types} from "mongoose";
import {sk} from "date-fns/locale/sk";

@Injectable()
export class PostsQueryRepository {
    constructor(
        @InjectModel(Post.name) private PostModel: PostModelType,
    ) {}
    async getByIdOrNotFoundFail(id: string): Promise<PostViewDto> {
        const objectId = new Types.ObjectId(id);
        const post= await this.PostModel.findOne({
            _id: objectId,
            deletedAt: null,
        });
        if (!post) {
            throw new NotFoundException('Post not found');
        }
        return PostViewDto.mapToView(post);
    }
    async getAll(query: GetPotsQueryParams): Promise<PaginatedViewDto<PostViewDto[]>> {
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
        const items = posts.map(PostViewDto.mapToView);
        return PaginatedViewDto.mapToView( {
            items,
            totalCount,
            page: pageNumber,
            size: pageSize
        });
    }
    async getPostsByBlogId(blogId: string, query: GetPotsQueryParams): Promise<PaginatedViewDto<PostViewDto[]>> {
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
        const items = posts.map(PostViewDto.mapToView);
        return PaginatedViewDto.mapToView( {
            items,
            totalCount,
            page: pageNumber,
            size: pageSize
        });
    }
}