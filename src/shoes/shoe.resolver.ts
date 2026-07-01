import { Args, Query, Resolver } from '@nestjs/graphql';
import { Shoe, ShoeRespose } from './shoe.modal';
import { PrismaService } from 'src/prisma/prisma.service';
import { Public } from 'src/common/decorators/public.decorator';
import { ShoeFilterInput } from './dto/shoe-filter.input';

@Resolver(() => Shoe)
export class ShoeResolver {
  constructor(private prisma: PrismaService) {}

  @Query(() => ShoeRespose)
  @Public()
  async shoe(
    @Args('filter', { type: () => ShoeFilterInput, nullable: true })
    filter?: ShoeFilterInput,
  ) {
    
    const {
      categories = [],
      brands = [],
      colors = [],
      priceMin,
      priceMax,
      search,
      sortBy,
      page = 1,
      pageSize = 20,
    } = filter || {};
    const skip = (page - 1) * pageSize;
    const colorsArray = colors ? colors.map(i => i.toLowerCase()) : [];

    const where: any = {
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { category: { title: { contains: search, mode: 'insensitive' } } },
          { brand: { title: { contains: search, mode: 'insensitive' } } },
        ],
      }),
      ...(categories?.length > 0 && {
        category: {
          title: {
            in: categories,
          },
        },
      }),
      ...(brands?.length > 0 && {
        brand: {
          title: {
            in: brands,
          },
        },
      }),
      price: {
        gte: priceMin,
        lte: priceMax,
      },
      ...(colorsArray?.length > 0 && {
        colorVariation: {
          some: {
            color: {
              hasSome: colorsArray,
            },
          },
        },
      }),
    };

    let orderBy: any = {};
    switch (sortBy) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'price_low_to_high':
        orderBy = { price: 'asc' };
        break;
      case 'price_high_to_low':
        orderBy = { price: 'desc' };
        break;
      case 'top_sellers':
        orderBy = { sold_amount: 'desc' };
        break;
    }

    const totalData = await this.prisma.shoe.count({ where });

    const shoes = await this.prisma.shoe.findMany({
      skip,
      take: pageSize,
      where,
      orderBy,
      include: {
        category: true,
        brand: true,
        rating: true,
        colorVariation: {
          include: {
            colorVariationImages: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
    return { data: shoes, totalData, page, pageSize };
  }
}
