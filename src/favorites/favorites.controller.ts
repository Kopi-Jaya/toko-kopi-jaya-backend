import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

@ApiTags('favorites')
@ApiBearerAuth()
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all favorites for an outlet' })
  @ApiQuery({ name: 'outlet_id', type: Number, required: true })
  @ApiResponse({ status: 200, description: 'List of outlet favorites returned successfully' })
  findAll(@Query('outlet_id', ParseIntPipe) outletId: number) {
    return this.favoritesService.findAll(outletId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a product to an outlet\'s favorites' })
  @ApiResponse({ status: 201, description: 'Favorite added successfully' })
  create(@Body() dto: CreateFavoriteDto) {
    return this.favoritesService.create(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a product from favorites' })
  @ApiResponse({ status: 204, description: 'Favorite removed successfully' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.favoritesService.remove(id);
  }
}
