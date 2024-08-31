import { Controller, Delete, Get, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ImageProcessingService } from './image-processing.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('files')
export class ImageProcessingController {
    constructor(private readonly s3Service: ImageProcessingService) {}

    @Get('image/:filename')
    async getFile(@Param('filename') filename: string) {
        try {
            const response = await this.s3Service.getObject(`images/${filename}`);
            return response;
        } catch(err) {
            console.log(err);
            throw new Error(err.messsage);
        }
    }

    @Get('video/:filename') 
    async getVideofile(@Param('filename') filename: string) {
        const response = await this.s3Service.getObject(`video/${filename}`);
        return response;
    }

    @Delete(':filename')
    async deleteFile(@Param('filename') filename: string) {
        const response = await this.s3Service.deleteObject(`images/${filename}`);
        return response;
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async putFile(@UploadedFile() file: Express.Multer.File) {
        await this.s3Service.createObject(`video/${file.originalname}`, file.buffer, 'video/mp4');
        const response2 = await this.s3Service.convertVideoAndUpload(`video/${file.originalname}`, `video/converted-video.mp4`);
        return response2;
    }
}
