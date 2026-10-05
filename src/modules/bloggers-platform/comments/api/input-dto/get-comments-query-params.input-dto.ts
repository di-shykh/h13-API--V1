import {CommentSortField} from './comment-sort-by'
import {BaseQueryParams} from "../../../../../core/dto/base.query-params.input-dto";

export class GetCommentsQueryParams extends BaseQueryParams {
    sortBy: CommentSortField.CreatedAt;
    postId?: string | null = null;
    userId?: string | null = null;
    userLogin?: string | null = null;
    createdAt?: string | null = null;
    searchContentTerm?: string | null = null;
}