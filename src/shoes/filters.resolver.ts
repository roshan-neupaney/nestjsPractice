// filters.resolver.ts
import { Resolver, Query } from '@nestjs/graphql';
import { PrismaService } from 'src/prisma/prisma.service';
import { Public } from 'src/common/decorators/public.decorator';
import { FiltersPayload } from './filters.modal';

@Resolver()
export class FiltersResolver {
  constructor(private prisma: PrismaService) {}

//   @Query(() => [Category])
//   @Public()
//   async categories() {
//     return this.prisma.category.findMany({
//       where: { status: 'ACTIVE' }, // or remove if you want all
//       orderBy: { title: 'asc' },
//     });
//   }

//   @Query(() => [Brand])
//   @Public()
//   async brands() {
//     return this.prisma.brand.findMany({
//       where: { status: 'ACTIVE' },
//       orderBy: { title: 'asc' },
//     });
//   }

//   @Query(() => [Color])
//   @Public()
//   async colors() {
//     return this.prisma.color.findMany({
//       where: { status: 'ACTIVE' },
//       orderBy: { title: 'asc' },
//     });
//   }

  @Query(() => FiltersPayload)
  @Public()
  async shoeFilters() {
    const [categories, brands, colors] = await Promise.all([
      this.prisma.category.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { title: 'asc' },
      }),
      this.prisma.brand.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { title: 'asc' },
      }),
      this.prisma.color.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { title: 'asc' },
      }),
    ]);

    return { categories, brands, colors };
  }
}