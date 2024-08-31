import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ImageProcessingModule } from './image-processing/image-processing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.${process.env.NODE_ENV}.env`,
    }),
    ImageProcessingModule
  ],
})
export class AppModule {}
