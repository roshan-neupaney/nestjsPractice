import { Field, ObjectType } from "@nestjs/graphql";
import { Brand } from "./brand.modal";
import { Color } from "./color.modal";
import { Category } from "src/category/category.modal";

@ObjectType()
export class FiltersPayload {
  @Field(() => [Category])
  categories: Category[];

  @Field(() => [Brand])
  brands: Brand[];

  @Field(() => [Color])
  colors: Color[];
}