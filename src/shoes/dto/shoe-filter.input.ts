// dto/shoe-filter.input.ts
import { InputType, Field, Int, Float } from '@nestjs/graphql';

@InputType()
export class ShoeFilterInput {
  @Field(() => [String], { nullable: true })
  categories?: string[];

  @Field(() => [String], { nullable: true })
  brands?: string[];

  @Field(() => [String], { nullable: true })
  colors?: string[];

  @Field(() => Float, { nullable: true })
  priceMin?: number;

  @Field(() => Float, { nullable: true })
  priceMax?: number;

  @Field({ nullable: true })
  search?: string;

  @Field({ nullable: true })
  sortBy?: 'newest' | 'price_low_to_high' | 'price_high_to_low' | 'top_sellers';

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  pageSize?: number;
}