import {PostsSortBy} from "./posts-sort-by";
import {BaseQueryParams} from "../../../../../core/dto/base.query-params.input-dto";
import {IsEnum, IsOptional, IsString} from "class-validator";

export class GetPotsQueryParams extends BaseQueryParams {
    @IsOptional()
    @IsEnum(PostsSortBy)
    sortBy = PostsSortBy.CreatedAt;

    @IsOptional()
    @IsString()
    searchPostTitleTerm : string | null = null;
}