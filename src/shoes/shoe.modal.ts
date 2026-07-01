import { Field, ID, Int, ObjectType } from "@nestjs/graphql";
import { ColorVariation } from "./colorVariation.modal";
import { Category } from "src/category/category.modal";

@ObjectType()
export class Shoe {
    @Field(() => ID)
    id: string;

    @Field(() => String)
    title: string

    @Field(() => String)
    slug_url: string
    
    @Field(() => String)
    price: string
    
    @Field(() => String)
    previous_price: string
    
    @Field(() => String)
    description: string
    
    @Field(() => String)
    category_id: string
    
    @Field(() => String)
    type: string
    
    @Field(() => String)
    details: string
    
    @Field(() => Number)
    sold_amount: number;
    
    @Field(() => String)
    createdAt: string
    
    @Field(() => Boolean)
    status: boolean
    
    @Field(() => [ColorVariation])
    colorVariation: ColorVariation[];
    
    @Field(() => Category , {nullable: true})
    category: Category;
}

@ObjectType()
export class ShoeRespose {
  @Field(() => [Shoe])
  data: Shoe[];

  @Field(() => Int)
  totalData: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  pageSize: number;
}