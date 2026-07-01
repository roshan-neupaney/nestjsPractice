import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { ShoesModule } from './shoes/shoes.module';
import { APP_GUARD } from '@nestjs/core';
import { AtGuard } from './common/guards/at.guard';
import { EsewaModule } from './esewa/esewa.module';
import { CategoryModule } from './category/category.module';
import { BrandModule } from './brand/brand.module';
import { ColorModule } from './color/color.module';
import { InteractionModule } from './interaction/interaction.module';
import { RatingModule } from './rating/rating.module';
import { LocationModule } from './location/location.module';
import { OrderModule } from './order/order.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    AuthenticationModule,
    ShoesModule,
    EsewaModule,
    CategoryModule,
    BrandModule,
    ColorModule,
    InteractionModule,
    RatingModule,
    LocationModule,
    OrderModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      introspection: true,
      path: '/graphql',
      context: ({ req, res }) => ({ req, res }),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AtGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('songs');
    // consumer.apply(LoggerMiddleware).forRoutes({path: 'songs', method: RequestMethod.POST})
    // consumer.apply(LoggerMiddleware).forRoutes(SongsController)
  }
}
