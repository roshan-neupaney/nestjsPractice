import { Module } from '@nestjs/common';
import { ShoesService } from './shoes.service';
import { ShoesController } from './shoes.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ShoeResolver } from './shoe.resolver';
import { FiltersResolver } from './filters.resolver';

@Module({
  controllers: [ShoesController],
  providers: [ShoesService, PrismaService, ShoeResolver, FiltersResolver],
})
export class ShoesModule {}
