import {Type} from "class-transformer";
import {IsInt, IsOptional, Min, Max, IsEnum} from 'class-validator';

export enum SortDirection {
    Asc = 'asc',
    Desc = 'desc',
}

export class BaseQueryParams {
    //для трансформации в number
    @IsOptional()
    @Type(()=> Number)
    @IsInt()
    @Min(1)
    pageNumber: number = 1;

    @IsOptional()
    @Type(()=> Number)
    @IsInt()
    @Min(1)
    @Max(100)
    pageSize: number = 10;

    @IsOptional()
    @IsEnum(SortDirection)
    sortDirection: SortDirection = SortDirection.Desc;

    calculateSkip(){
        return (this.pageNumber - 1) * this.pageSize;
    }
}

