import {CommentSortField} from './comment-sort-by'
import {BaseQueryParams} from "../../../../../core/dto/base.query-params.input-dto";
import {IsEnum, IsOptional, IsString} from "class-validator";

export class GetCommentsQueryParams extends BaseQueryParams {
    @IsOptional()
    @IsEnum(CommentSortField)
    sortBy: CommentSortField.CreatedAt;

    @IsOptional()
    @IsString()
    postId?: string | null = null;

    @IsOptional()
    @IsString()
    userId?: string | null = null;

    @IsOptional()
    @IsString()
    userLogin?: string | null = null;

    @IsOptional()
    @IsString()
    createdAt?: string | null = null;

    @IsOptional()
    @IsString()
    searchContentTerm?: string | null = null;
}