//dto для запроса списка юзеров с пагинацией, сортировкой, фильтрами
import { UsersSortBy } from './users-sort-by';
import {BaseQueryParams, SortDirection} from '../../../../core/dto/base.query-params.input-dto';
import {IsEnum, IsIn, IsInt, IsOptional, IsString, Min} from 'class-validator';
import {Type} from "class-transformer";

//наследуемся от класса BaseQueryParams, где уже есть pageNumber, pageSize и т.п., чтобы не дублировать эти свойства
export class GetUsersQueryParams extends BaseQueryParams {
    @IsEnum(UsersSortBy)
    @IsOptional()
    sortBy = UsersSortBy.CreatedAt;

    @IsOptional()
    @IsIn([SortDirection.Asc, SortDirection.Desc])
    sortDirection: SortDirection = SortDirection.Desc;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    pageNumber: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    pageSize: number = 10;

    @IsString()
    @IsOptional()
    searchLoginTerm: string | null = null;

    @IsString()
    @IsOptional()
    searchEmailTerm: string | null = null;
}