// color.model.ts
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Color {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  color_code: string;

  @Field()
  status: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}