import {PostsSortBy} from "./posts-sort-by";
import {BaseQueryParams} from "../../../../../core/dto/base.query-params.input-dto";

export class GetPotsQueryParams extends BaseQueryParams {
    sortBy = PostsSortBy.CreatedAt;
    searchPostTitleTerm : string | null = null;
}