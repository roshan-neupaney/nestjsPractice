import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Shoe } from "src/shoes/shoe.modal";

@ObjectType()
export class Category {
    @Field(() => ID)
    id: string;

    @Field(() => String)
    title: string;

    @Field(() => String)
    description: string;

    @Field(() => [Shoe])
    shoe: Shoe;
}