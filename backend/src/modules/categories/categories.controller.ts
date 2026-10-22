import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AccountContextGuard } from '../../common/guards/account-context.guard';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { CategoryType } from '@prisma/client';

@Controller('categories')
@UseGuards(JwtAuthGuard, AccountContextGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async list(
    @CurrentAccount('id') accountId: string,
    @Query('type') type?: CategoryType,
  ) {
    const categories = await this.categoriesService.list(accountId, type);
    return {
      status: 'success',
      data: categories,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentAccount('id') accountId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    const category = await this.categoriesService.create(accountId, dto);
    return {
      status: 'success',
      data: category,
    };
  }

  @Get(':id')
  async getOne(
    @CurrentAccount('id') accountId: string,
    @Param('id') id: string,
  ) {
    const category = await this.categoriesService.findById(accountId, id);
    return {
      status: 'success',
      data: category,
    };
  }

  @Patch(':id')
  async update(
    @CurrentAccount('id') accountId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const category = await this.categoriesService.update(accountId, id, dto);
    return {
      status: 'success',
      data: category,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @CurrentAccount('id') accountId: string,
    @Param('id') id: string,
  ) {
    await this.categoriesService.delete(accountId, id);
    return {
      status: 'success',
      data: {
        message: 'Category successfully deleted.',
      },
    };
  }
}
