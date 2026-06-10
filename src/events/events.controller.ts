import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { StaffRole } from '../common/enums';

const EVENT_IMAGE_SUBDIR = 'events';
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly configService: ConfigService,
  ) {}

  private get publicApiUrl(): string {
    return (
      this.configService.get<string>('PUBLIC_API_URL') ?? ''
    );
  }

  private get uploadsRoot(): string {
    return (
      this.configService.get<string>('UPLOADS_DIR') ??
      join(process.cwd(), 'uploads')
    );
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List events (filterable by outlet, active, upcoming)' })
  @ApiResponse({ status: 200, description: 'Events list' })
  findAll(@Query() query: QueryEventDto) {
    return this.eventsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single event' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.findOne(id);
  }

  @Roles(StaffRole.SUPER_ADMIN, StaffRole.ADMIN, StaffRole.MANAGER)
  @Post()
  @ApiOperation({ summary: 'Create an event' })
  @ApiResponse({ status: 201, description: 'Event created' })
  create(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }

  @Roles(StaffRole.SUPER_ADMIN, StaffRole.ADMIN, StaffRole.MANAGER)
  @Patch(':id')
  @ApiOperation({ summary: 'Update an event' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }

  @Roles(StaffRole.SUPER_ADMIN, StaffRole.ADMIN, StaffRole.MANAGER)
  @Post(':id/image')
  @ApiOperation({ summary: 'Upload event image (multipart/form-data)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 201, description: 'Image stored; event.img_url updated' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const root = process.env.UPLOADS_DIR || join(process.cwd(), 'uploads');
          const dir = join(root, EVENT_IMAGE_SUBDIR);
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
  async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    const publicUrl = `${this.publicApiUrl}/uploads/${EVENT_IMAGE_SUBDIR}/${file.filename}`;
    return this.eventsService.setImage(id, publicUrl);
  }

  @Roles(StaffRole.SUPER_ADMIN, StaffRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an event (soft)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.remove(id);
  }
}
