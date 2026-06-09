import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import { OutletsService } from './outlets.service';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';
import { QueryOutletDto } from './dto/query-outlet.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { StaffRole } from '../common/enums';

const OUTLET_LOGO_SUBDIR = 'outlets';
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

@ApiTags('outlets')
@ApiBearerAuth()
@Controller('outlets')
export class OutletsController {
  constructor(
    private readonly outletsService: OutletsService,
    private readonly configService: ConfigService,
  ) {}

  private get uploadsRoot(): string {
    return (
      this.configService.get<string>('UPLOADS_DIR') ??
      join(process.cwd(), 'uploads')
    );
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all outlets with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of outlets returned successfully',
  })
  findAll(@Query() query: QueryOutletDto) {
    return this.outletsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get an outlet by ID' })
  @ApiResponse({ status: 200, description: 'Outlet returned successfully' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.outletsService.findOne(id);
  }

  @Roles(StaffRole.SUPER_ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new outlet' })
  @ApiResponse({ status: 201, description: 'Outlet created successfully' })
  create(@Body() dto: CreateOutletDto) {
    return this.outletsService.create(dto);
  }

  @Roles(StaffRole.SUPER_ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update an outlet' })
  @ApiResponse({ status: 200, description: 'Outlet updated successfully' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOutletDto) {
    return this.outletsService.update(id, dto);
  }

  @Roles(StaffRole.SUPER_ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an outlet' })
  @ApiResponse({ status: 204, description: 'Outlet deleted successfully' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.outletsService.remove(id);
  }

  @Roles(StaffRole.SUPER_ADMIN)
  @Post(':id/logo')
  @ApiOperation({ summary: 'Upload an outlet logo (multipart/form-data)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 201, description: 'Logo stored; outlet.logo_url updated' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const root = process.env.UPLOADS_DIR || join(process.cwd(), 'uploads');
          const dir = join(root, OUTLET_LOGO_SUBDIR);
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: MAX_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              `Unsupported mime type: ${file.mimetype}. Allowed: ${ALLOWED_MIME.join(', ')}`,
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadLogo(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('No file uploaded (field name must be "file")');

    const relativePath = `${OUTLET_LOGO_SUBDIR}/${file.filename}`;
    const publicApiUrl = this.configService.get<string>('PUBLIC_API_URL')?.replace(/\/+$/, '');
    let publicUrl: string;
    if (publicApiUrl) {
      publicUrl = `${publicApiUrl}/uploads/${relativePath}`;
    } else {
      const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
      const forwardedHost = req.headers['x-forwarded-host'];
      const host =
        (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) ??
        req.headers.host ?? '';
      publicUrl = `${proto}://${host}/uploads/${relativePath}`;
    }

    return this.outletsService.setLogo(id, publicUrl, relativePath, this.uploadsRoot);
  }
}
