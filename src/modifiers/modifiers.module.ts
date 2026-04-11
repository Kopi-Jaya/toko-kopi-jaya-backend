import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Modifier } from './entities/modifier.entity';
import { ModifiersController } from './modifiers.controller';
import { ModifiersService } from './modifiers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Modifier])],
  controllers: [ModifiersController],
  providers: [ModifiersService],
  exports: [ModifiersService],
})
export class ModifiersModule {}
