import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}
  async getHello() {
    // function groupBy<T>(
    //   array: T[],
    //   key: (item: T) => string,
    // ): Record<string, T[]> {
    //   return array?.reduce(
    //     (result, item) => {
    //       const keyValue = key(item);
    //       if (!result[keyValue]) {
    //         result[keyValue] = [];
    //       }
    //       result[keyValue].push(item);
    //       return result;
    //     },
    //     {} as Record<string, T[]>,
    //   );
    // }
    // const allImages = await this.prisma.colorVariationImages.findMany({
    //   orderBy: {
    //     createdAt: 'asc',
    //   }, 
    // });
    // const groupedData = groupBy(allImages, (item) => item.color_variation_id);
    // for (const key in groupedData) {
    //   await Promise.all(
    //     groupedData[key].map(async (_items, index) => {
    //       await this.prisma.colorVariationImages.update({
    //         where: { id: _items.id },
    //         data: {
    //           order: index,
    //         },
    //       });
    //     }),
    //   );
    // }
    // return groupedData;
    return 'Hello world'
  }
}
