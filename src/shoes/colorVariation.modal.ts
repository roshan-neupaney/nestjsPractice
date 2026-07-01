import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Size } from "./size.modal";
import { Shoe } from "./shoe.modal";

@ObjectType()
export class ColorVariation {
    @Field(() => ID)
    id: string;

    @Field(() => [String])
    color: string[];

    @Field(() => String)
    image_url: string;

    @Field(() => [Size])
    sizes: Size[];

    @Field(() => String)
    shoe_id: string;

    @Field(() => Shoe)
    shoe: Shoe;
}