// brand.model.ts
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Brand {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  image_name: string;

  @Field()
  status: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}