import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

@ApiTags('favorites')
@ApiBearerAuth()
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all favorites for current user' })
  @ApiResponse({ status: 200, description: 'List of favorites returned successfully' })
  findAll(@Request() req) {
    return this.favoritesService.findAll(Number(req.user.sub));
  }

  @Post()
  @ApiOperation({ summary: 'Add a product to favorites' })
  @ApiResponse({ status: 201, description: 'Favorite added successfully' })
  create(@Request() req, @Body() dto: CreateFavoriteDto) {
    return this.favoritesService.create(Number(req.user.sub), dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a product from favorites' })
  @ApiResponse({ status: 204, description: 'Favorite removed successfully' })
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.favoritesService.remove(Number(req.user.sub), id);
  }
}
