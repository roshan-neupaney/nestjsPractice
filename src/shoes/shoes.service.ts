import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateShoeDto } from './dto/create-shoe.dto';
import { UpdateShoeDto } from './dto/update-shoe.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryTypes } from './shoes.types';
import { join } from 'path';
import { unlink } from 'fs';
import { CreateCartDto } from './dto/create-cart.dto';
import { VariationDto } from './dto/create-variation.dto';
import { SizeDto } from './dto/create-size.dto';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class ShoesService {
  constructor(private prisma: PrismaService) {}
  async create(createShoeDto: CreateShoeDto, colorVariation: any) {
    try {
      // const result = await this.prisma.$transaction(async (prisma) => {
      delete createShoeDto['color_variation'];
      const slug_url =
        createShoeDto.title.replaceAll(' ', '_') +
        '_' +
        Math.floor(Math.random() * Date.now() * 0.0001).toString();
      const shoeResponse = await this.prisma.shoe.create({
        data: {
          title: createShoeDto.title,
          slug_url: slug_url,
          brand_id: createShoeDto.brand_id,
          category_id: createShoeDto.category_id,
          type: createShoeDto.type,
          price: createShoeDto.price,
          previous_price: createShoeDto.previous_price,
          description: createShoeDto.description,
          details: createShoeDto.details,
          status: createShoeDto.status,
        },
      });

      for (const cv of colorVariation) {
        const cvResponse = await this.prisma.colorVariation.create({
          data: {
            color: JSON.parse(cv.color),
            image_url: cv.image_url,
            shoe_id: shoeResponse.id,
          },
        });
        for (const s of cv.sizes) {
          await this.prisma.size.create({
            data: {
              size: s.size,
              stock: s.stock,
              color_variation_id: cvResponse.id,
            },
          });
        }
      }
      return shoeResponse;
      // });
      // return result;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll(query: QueryTypes) {
    const {
      categories,
      price_min,
      price_max,
      colors,
      brands,
      sortBy,
      page,
      pageSize,
      search,
    } = query;
    const colorsArray = colors ? colors.toLowerCase().split(',') : [];
    const categoriesArray = categories ? categories.split('|') : [];
    const brandsArray = brands ? brands.split(',') : [];
    const skip = (page - 1) * pageSize || 0;
    const where: any = {
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { category: { title: { contains: search, mode: 'insensitive' } } },
          { brand: { title: { contains: search, mode: 'insensitive' } } },
        ],
      }),
      ...(categoriesArray?.length > 0 && {
        category: {
          title: {
            in: categoriesArray,
          },
        },
      }),
      ...(brands?.length > 0 && {
        brand: {
          title: {
            in: brandsArray,
          },
        },
      }),
      price: {
        gte: price_min,
        lte: price_max,
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
    const shoeList = await this.prisma.shoe.findMany({
      skip,
      take: pageSize,
      where,
      include: {
        category: true,
        colorVariation: {
          include: {
            colorVariationImages: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
        brand: true,
        rating: true,
        // uncomment after some time
        // favorite: {
        //   where: {
        //     user_id,
        //   },
        // },
      },
      orderBy:
        sortBy === 'newest'
          ? { createdAt: 'desc' }
          : sortBy === 'price_low_to_high'
            ? { price: 'asc' }
            : sortBy === 'price_high_to_low'
              ? { price: 'desc' }
              : sortBy === 'top_sellers'
                ? { sold_amount: 'desc' }
                : {},
    });
    const totalData = await this.prisma.shoe.count({ where });
    return { data: shoeList, totalData, page, pageSize };
  }

  async findOne(id: string, user_id: string) {
    const result = await this.prisma.$transaction(async (prisma) => {
      const response = await prisma.shoe.findFirst({
        where: {
          OR: [
            {
              slug_url: id,
            },
            {
              id,
            },
          ],
        },
        include: {
          category: true,
          colorVariation: {
            include: {
              sizes: true,
              colorVariationImages: {
                orderBy: {
                  order: 'asc',
                },
              },
            },
          },
          brand: true,
          rating: {
            orderBy: {
              createdAt: 'desc',
            },
            include: {
              user: true,
            },
          },
        },
      });
      const favorite = await prisma.favorite.findFirst({
        where: {
          shoe_id: response.id,
          user_id,
        },
      });
      return { ...response, isFav: !!favorite };
    });
    return result;
  }

  async update(id: string, updateShoeDto: UpdateShoeDto, colorVariation: any) {
    delete updateShoeDto['color_variation'];
    const { deleteColorVariation, deleteSizeVariation } = updateShoeDto;
    const result = await this.prisma.$transaction(async (prisma) => {
      const shoeResponse = await prisma.shoe.update({
        where: { slug_url: id },
        data: {
          title: updateShoeDto.title,
          brand_id: updateShoeDto.brand_id,
          price: updateShoeDto.price,
          type: updateShoeDto.type,
          previous_price: updateShoeDto.previous_price,
          description: updateShoeDto.description,
          category_id: updateShoeDto.category_id,
          details: updateShoeDto.details,
          status: updateShoeDto.status,
        },
      });
      if (deleteColorVariation?.length > 0) {
        for (const item of deleteColorVariation) {
          await prisma.colorVariation.delete({ where: { id: item } });
        }
      }
      if (deleteSizeVariation?.length > 0) {
        for (const item of deleteSizeVariation) {
          await prisma.size.delete({ where: { id: item } });
        }
      }
      const colorVariationResponse = await Promise.all(
        colorVariation.map(async (cv: VariationDto) => {
          if (cv.id) {
            const existingImage = await prisma.colorVariation.findUnique({
              where: { id: cv.id },
            });
            if (existingImage && !(existingImage.image_url === cv.image_url)) {
              if (process.env.STORAGE == 'cloudinary') {
                const publicId = existingImage.image_url;
                const result = await cloudinary.uploader.destroy(publicId);
                if (result.result !== 'ok') {
                  throw new Error('Error deleting image from Cloudinary');
                }
              } else {
                const existingImagePath = join(
                  './public',
                  'uploads',
                  'images',
                  existingImage.image_url,
                );

                unlink(existingImagePath, (error) => {
                  if (error) return 'Error while updating shoe';
                });
              }
            }
            const resCV = await prisma.colorVariation.update({
              where: {
                id: cv.id,
              },
              data: {
                color: JSON?.parse(cv?.color),
                image_url: cv.image_url,
              },
            });
            const resSize = await Promise.all(
              cv.sizes.map(async (s: SizeDto) => {
                if (s.id) {
                  return await prisma.size.update({
                    where: {
                      id: s.id,
                    },
                    data: {
                      size: s.size,
                      stock: s.stock,
                    },
                  });
                } else {
                  return await prisma.size.create({
                    data: {
                      size: s.size,
                      stock: s.stock,
                      color_variation_id: resCV.id,
                    },
                  });
                }
              }),
            );
            return { ...resCV, sizes: resSize };
          } else {
            const resCV = await prisma.colorVariation.create({
              data: {
                color: JSON.parse(cv.color),
                image_url: cv.image_url,
                shoe_id: shoeResponse.id,
              },
            });
            const resSize = await Promise.all(
              cv.sizes.map(async (s: SizeDto) => {
                return await prisma.size.create({
                  data: {
                    size: s.size,
                    stock: s.stock,
                    color_variation_id: resCV.id,
                  },
                });
              }),
            );
            return { ...resCV, sizes: resSize };
          }
        }),
      );
      return { ...shoeResponse, colorVariation: colorVariationResponse };
    });
    return result;
  }

  remove(id: string) {
    return this.prisma.shoe.deleteMany({
      where: {
        OR: [{ id }, { slug_url: id }],
      },
    });
  }

  async createCart(createCartDto: CreateCartDto) {
    return await this.prisma.$transaction(async (prisma) => {
      const { user_id, shoe_id, size, color_variation_id } = createCartDto;
      const existingProduct = await prisma.cart.findFirst({
        where: {
          user_id,
          shoe_id,
          size,
          color_variation_id,
        },
      });
      if (existingProduct) {
        return await prisma.cart.update({
          data: {
            count: existingProduct.count + 1,
          },
          where: {
            id: existingProduct.id,
          },
        });
      } else {
        const cart = await prisma.cart.create({
          data: {
            shoe_id,
            size,
            color_variation_id,
            user_id,
          },
        });
        await prisma.interaction.create({
          data: {
            shoe_id,
            user_id,
            interaction_score: 4,
            action_type: 'addToCart',
          },
        });
        return cart;
      }
    });
  }

  async changeCartProductQuantity(id: string, quantity: number) {
    return await this.prisma.cart.update({
      data: {
        count: quantity,
      },
      where: {
        id: id,
      },
    });
  }

  async findUserCart(user_id: string) {
    const result = await this.prisma.$transaction(async (prisma) => {
      const cartResponse = await prisma.cart.findMany({
        where: {
          user_id,
        },
        select: {
          id: true,
          size: true,
          count: true,
          createdAt: true,
          shoe: {
            select: {
              id: true,
              title: true,
              price: true,
            },
          },
          colorVariation: {
            select: {
              id: true,
              color: true,
              image_url: true,
              sizes: true,
            },
          },
          color_variation_id: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
      const finalResponse = await Promise.all(
        cartResponse.map(async (cart) => {
          const favorite = await prisma.favorite.findFirst({
            where: {
              shoe_id: cart.shoe.id,
              user_id,
            },
          });
          const stock = cart.colorVariation.sizes.filter(
            (s) => s.size === cart.size,
          )[0];
          return { ...cart, isFav: !!favorite, stock: stock.stock };
        }),
      );
      return finalResponse;
    });
    return result;
  }

  async deleteCart(id: string) {
    return await this.prisma.$transaction(async (prisma) => {
      const cart = await prisma.cart.delete({ where: { id } });
      await prisma.interaction.updateMany({
        where: {
          shoe_id: cart.shoe_id,
          user_id: cart.user_id,
          action_type: 'addToCart',
        },
        data: {
          isActive: false,
        },
      });
    });
  }

  async createFavorites(shoe_id: string, user_id: string) {
    const result = this.prisma.$transaction(async (prisma) => {
      const existingFavorite = await prisma.favorite.findFirst({
        where: { shoe_id, user_id },
      });
      if (existingFavorite) {
        const fav = await prisma.favorite.delete({
          where: {
            id: existingFavorite.id,
          },
        });
        await prisma.interaction.updateMany({
          where: {
            shoe_id,
            user_id,
            action_type: 'favorite',
            isActive: true,
          },
          data: {
            isActive: false,
          },
        });
        return fav;
      } else {
        const fav = await prisma.favorite.create({
          data: {
            shoe_id,
            user_id,
          },
        });
        await prisma.interaction.create({
          data: {
            shoe_id,
            user_id,
            interaction_score: 3,
            action_type: 'favorite',
          },
        });
        return fav;
      }
    });
    return result;
  }
  async findAllFavorites(userId: string) {
    return await this.prisma.favorite.findMany({
      where: {
        user_id: userId,
      },
      select: {
        id: true,
        shoe: true,
      },
    });
  }

  async createColorVariationImages(createColorVariationImages: any) {
    const result = await Promise.all(
      createColorVariationImages.images.map(async (img) => {
        return await this.prisma.colorVariationImages.create({
          data: {
            color_variation_id: createColorVariationImages.color_variation_id,
            image_url: img.image_url,
            order: img.order,
          },
        });
      }),
    );
    return result;
  }

  async updateColorVariationImages(updateColorVariationImages: any) {
    const result = await Promise.all(
      updateColorVariationImages.images.map(async (img) => {
        if (img?.id) {
          const existingImage =
            await this.prisma.colorVariationImages.findUnique({
              where: { id: img.id },
            });
          if (existingImage && !(existingImage.image_url === img.file)) {
            if (process.env.STORAGE == 'cloudinary') {
              const publicId = existingImage.image_url
                ?.split('/')[1]
                ?.split('.')[0];
              const result = await cloudinary.uploader.destroy(publicId);
              if (result.result !== 'ok') {
                throw new Error('Error deleting image from Cloudinary');
              }
            } else {
              const existingImagePath = join(
                './public',
                'uploads',
                'images',
                existingImage.image_url,
              );
              unlink(existingImagePath, (error) => {
                if (error) return 'Error while updating shoe';
              });
            }
          }
          return await this.prisma.colorVariationImages.update({
            where: {
              id: img.id,
            },
            data: {
              color_variation_id: img.color_variation_id,
              image_url: img.file,
              order: Number(img.order),
            },
          });
        } else {
          return await this.prisma.colorVariationImages.create({
            data: {
              color_variation_id: updateColorVariationImages.color_variation_id,
              image_url: img.file,
              order: Number(img.order),
            },
          });
        }
      }),
    );
    return result;
  }

  async deleteColorVariationImages(id: string) {
    const existingImage = await this.prisma.colorVariationImages.findUnique({
      where: { id },
    });
    if (existingImage) {
      if (process.env.STORAGE == 'cloudinary') {
        const publicId =
          existingImage.image_url?.split('/')[1]?.split('.')[0] ||
          existingImage.image_url;
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result !== 'ok') {
          throw new Error('Error deleting image from Cloudinary');
        }
      } else {
        const existingImagePath = join(
          './public',
          'uploads',
          'images',
          existingImage.image_url,
        );

        unlink(existingImagePath, (error) => {
          if (error) return 'Error while updating shoe';
        });
      }
    }
    return this.prisma.colorVariationImages.delete({
      where: { id },
    });
  }
}
