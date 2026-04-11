import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ModifiersService } from './modifiers.service';
import { CreateModifierDto } from './dto/create-modifier.dto';
import { UpdateModifierDto } from './dto/update-modifier.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { StaffRole } from '../common/enums';

@ApiTags('modifiers')
@ApiBearerAuth()
@Controller('modifiers')
export class ModifiersController {
  constructor(private readonly modifiersService: ModifiersService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all modifiers' })
  @ApiResponse({ status: 200, description: 'List of modifiers returned successfully' })
  findAll() {
    return this.modifiersService.findAll();
  }

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER)
  @Post()
  @ApiOperation({ summary: 'Create a new modifier' })
  @ApiResponse({ status: 201, description: 'Modifier created successfully' })
  create(@Body() dto: CreateModifierDto) {
    return this.modifiersService.create(dto);
  }

  @Roles(StaffRole.ADMIN, StaffRole.MANAGER)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a modifier' })
  @ApiResponse({ status: 200, description: 'Modifier updated successfully' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateModifierDto) {
    return this.modifiersService.update(id, dto);
  }

  @Roles(StaffRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a modifier' })
  @ApiResponse({ status: 204, description: 'Modifier deleted successfully' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.modifiersService.remove(id);
  }
}
