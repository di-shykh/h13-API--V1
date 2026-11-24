import { BlogsSortBy} from "./blogs-sort-by";
import {BaseQueryParams} from "../../../../../core/dto/base.query-params.input-dto";
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class GetBlogsQueryParams extends BaseQueryParams {
    @IsOptional()
    @IsEnum(BlogsSortBy)
    sortBy = BlogsSortBy.CreatedAt;

    @IsOptional()
    @IsString()
    searchNameTerm : string | null = null;
}