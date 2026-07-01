import { Field, ID, ObjectType } from "@nestjs/graphql";
import { ColorVariation } from "./colorVariation.modal";

@ObjectType()
export class Size {
    @Field(() => ID)
    id: string;

    @Field(() => String)
    size: string;

    @Field(() => String)
    stock: string;

    @Field(() => String)
    color_variation_id: string;

    @Field(() => [ColorVariation])
    colorVariation: ColorVariation[];
}