import {Blog, type BlogModelType} from "../../domain/blog.entity";
import {InjectModel} from "@nestjs/mongoose";
import {BlogsViewDto} from "../../api/view-dto/blogs-view.dto";
import {Injectable, NotFoundException} from "@nestjs/common";
//import {FilterQuery} from "mongoose";
import {PaginatedViewDto} from "../../../../../core/dto/base.paginated.view-dto";
import {GetBlogsQueryParams} from "../../api/input-dto/get-blogs-query-params.input-dto";
import {Types} from "mongoose";

@Injectable()
export class BlogsQueryRepository {
    constructor(
        @InjectModel(Blog.name)
        private  BlogModel: BlogModelType,
    ) {}
    async getByIdOrNotFoundFail(id: string): Promise<BlogsViewDto> {
        const objectId = new Types.ObjectId(id);
        const blog = await this.BlogModel.findOne({
                _id: objectId,
                deletedAt: null,
            });
        if (!blog) {
            throw new NotFoundException('Blog not found');
        }
        return BlogsViewDto.mapToView(blog);
    }
    async getAll(query: GetBlogsQueryParams): Promise<PaginatedViewDto<BlogsViewDto[]>> {
        //todo спросить про FilterQuery
        const filter: any = {
            deletedAt: null,
        };

        const pageNumber = Number(query.pageNumber) || 1;
        const pageSize = Number(query.pageSize) || 10;
        const sortBy = query.sortBy || 'createdAt';
        const sortDirection = query.sortDirection === 'asc' ? 'asc' : 'desc';
        const searchNameTerm = query.searchNameTerm || null;

        const skip = (pageNumber - 1) * pageSize;

        if(query.searchNameTerm){
            filter.$or = filter.$or||[];
            filter.$or.push({
                name: { $regex: searchNameTerm, $options: "i" },
            });
        }
        const blogs = await this.BlogModel.find(filter)
            .sort({ [sortBy]: sortDirection })
            .skip(skip)
            .limit(pageSize);
        const totalCount = await this.BlogModel.countDocuments(filter);
        const items = blogs.map(BlogsViewDto.mapToView);
        return PaginatedViewDto.mapToView({
            items,
            totalCount,
            page: pageNumber,
            size: pageSize
        });
    }
}

