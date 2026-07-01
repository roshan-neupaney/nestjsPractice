import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  Query,
  UploadedFiles,
} from '@nestjs/common';
import { ShoesService } from './shoes.service';
import { CreateShoeDto } from './dto/create-shoe.dto';
import { UpdateShoeDto } from './dto/update-shoe.dto';
import { ApiTags } from '@nestjs/swagger';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { QueryTypes } from './shoes.types';
import { CreateCartDto } from './dto/create-cart.dto';
import { AuthUser } from 'src/common/decorators/user.decorator';
import {
  updateMultipleImages,
  uploadImageWithNoSizes,
  uploadMultipleImages,
} from 'src/common/helper';
import { AuthUserType } from 'src/common/FileType.type';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('shoes')
@UsePipes(ValidationPipe)
@ApiTags('shoes')
export class ShoesController {
  constructor(private readonly shoesService: ShoesService) {}

  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @Body() createShoeDto: CreateShoeDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    try {
      const colorVariation = await Promise.all(
        createShoeDto.color_variation.map(async (cv: any) => {
          const file = files.shift();
          const imageName = await uploadImageWithNoSizes(file);
          return { ...cv, image_url: imageName.fileName };
        }),
      );
      return this.shoesService.create(createShoeDto, colorVariation);
    } catch (e) {
      // throw new HttpException(e.message, e.status);
    }
  }

  @Get()
  @Public()
  async findAll(@Query() query: QueryTypes) {
    const shoe = await this.shoesService.findAll(query);
    console.log(shoe)
    return shoe
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string, @AuthUser() user: AuthUserType) {
    return this.shoesService.findOne(id, user?.sub);
  }

  @Patch(':id')
  @UseInterceptors(AnyFilesInterceptor())
  async update(
    @Param('id') id: string,
    @Body() updateShoeDto: UpdateShoeDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const color_variation = updateShoeDto.color_variation || [];
    const colorVariation = await Promise.all(
      color_variation?.map(async (cv) => {
        if (cv.file) {
          return { ...cv, image_url: cv.file };
        } else {
          const file = files.shift();
          const image = await uploadImageWithNoSizes(file);
          return { ...cv, image_url: image.fileName };
        }
      }),
    );
    return this.shoesService.update(id, updateShoeDto, colorVariation);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shoesService.remove(id);
  }

  @Post('user/cart')
  // @Public()
  createCart(@Body() createCartDto: CreateCartDto, @AuthUser() user: any) {
    createCartDto.user_id = user.sub;
    return this.shoesService.createCart(createCartDto);
  }

  @Post('user/cart/changeQuantity')
  @Public()
  changeCartProductQuantity(
    @Body('quantity') quantity: number,
    @Body('id') id: string,
  ) {
    return this.shoesService.changeCartProductQuantity(id, quantity);
  }

  @Get('user/cart')
  @Public()
  findUserCart(@AuthUser() user: AuthUserType) {
    return this.shoesService.findUserCart(user.sub);
  }

  @Delete('user/cart/:id')
  @Public()
  deleteCart(@Param('id') id: string) {
    return this.shoesService.deleteCart(id);
  }

  @Post('user/favorite/:id')
  @Public()
  createFavorite(@Param('id') id: string, @AuthUser() user: AuthUserType) {
    return this.shoesService.createFavorites(id, user.sub);
  }

  @Get('user/favorite')
  @Public()
  findAllFavorite(@AuthUser() user: AuthUserType) {
    return this.shoesService.findAllFavorites(user.sub);
  }

  @Post('colorVariation/images')
  @UseInterceptors(AnyFilesInterceptor())
  async createColorVariationImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
  ) {
    const result = await uploadMultipleImages(files, body.images);
    const payload = {
      color_variation_id: body.color_variation_id,
      images: result,
    };
    return this.shoesService.createColorVariationImages(payload);
  }

  @Patch('colorVariation/images')
  @UseInterceptors(AnyFilesInterceptor())
  async updateColorVariationImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
  ) {
    const newOrderList = body.images.filter(items => !items.file);
    const oldImages = body.images.filter(items => items.id)
    const images = await updateMultipleImages(files, newOrderList);
    const updateBody = oldImages.map((img) => {
      if (!img.file && img.id) {
        return { ...img, file: images.shift().file };
      } else if(img.file){
        return img;
      }
    });
    const payload = {
      color_variation_id: body.color_variation_id,
      images: [...images, ...updateBody],
    };
    return this.shoesService.updateColorVariationImages(payload);
  }

  @Delete('colorVariation/images/:id')
  async deleteColorVariationImages(@Param('id') id: string) {
    return await this.shoesService.deleteColorVariationImages(id);
  }
}
