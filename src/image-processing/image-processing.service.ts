import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Injectable } from '@nestjs/common';
import path, { resolve } from 'path';
import { PassThrough, Readable } from 'stream';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { createReadStream } from 'fs';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

@Injectable()
export class ImageProcessingService {
    private readonly s3Client: S3Client;

    constructor() {
        this.s3Client = new S3Client({
            credentials: {
                accessKeyId: process.env.YANDEX_ACCESS_KEY,
                secretAccessKey: process.env.YANDEX_SECRET_KEY,
            },
            endpoint: process.env.YANDEX_ENDPOINT,
            region: process.env.YANDEX_REGION,
        })
    }

    async getObject(key: string): Promise<Readable> {
        const command = new GetObjectCommand({
            Bucket: process.env.YANDEX_BUCKET_NAME,
            Key: key
        });

        try {
            const response = await this.s3Client.send(command);
            
            if(response.Body instanceof Readable) {
                return response.Body;
            } else {
                throw new Error('Response body is not a readable stream');
            }
        } catch(err) {
            console.log('Cannot get object from bucket: ', err);
            throw err;
        }
    }

    async convertVideoAndUpload(key: string, outputKey: string) {
        // const inputStream = await this.getObject(key);
        const inputStream = createReadStream(path.resolve('C:/Users/abdul/Downloads/video5339244300024696207.mp4')) ;
        
        if (!inputStream.readable) {
            throw new Error('Input stream is not readable');
        }

        const outputStream = new PassThrough();

        ffmpeg(inputStream)
            .outputFormat('mp4')
            .videoCodec('libx264')
            .audioCodec('aac')
            .on('start', (commandLine) => {
                console.log('FFmpeg process started with command: ' + commandLine);
            })
            .on('codecData', (data) => {
                console.log('Input is ' + data.video + ' video with ' + data.audio + ' audio');
            })
            .on('stderr', (stderrLine) => {
                console.log('FFmpeg stderr: ' + stderrLine);
            })
            .on('error', (err) => {
                console.log('Error during conversion: ', err);
                throw err;
            })
            .on('end', () => {
                console.log('Conversion finished successfully');
            })
            .pipe(outputStream, { end: true });

        await this.uploadS3(outputKey, outputStream);
            
    }

    async uploadS3(key: string, stream: Readable): Promise<void> {
        const upload = new Upload({
            client: this.s3Client,
            params: {
                Bucket: process.env.YANDEX_BUCKET_NAME,
                Key: key,
                Body: stream,
                ContentType: 'video/mp4',
            },
        })

        try {
            const response = await upload.done();
            console.log('Object uploaded successfully: ', response);
        } catch(err) {
            console.log("Cannot upload video file: ", err);
            throw err;
        }
    }

    async deleteObject(key: string) {
        const command = new DeleteObjectCommand({
            Bucket: process.env.YANDEX_BUCKET_NAME,
            Key: key
        });

        try {
            const response = await this.s3Client.send(command);
            console.log('Object deleted successfully: ', response);
        } catch(err) {
            console.log('Error on delete object: ', err);
        }
    }

    async createObject(key: string, file: Buffer, contentType: string) {
        const command = new PutObjectCommand({
            Key: key,
            Body: file,
            Bucket: process.env.YANDEX_BUCKET_NAME,
            // ContentType: 'image/jpeg'
            // ContentType: 'video/mp4'
            ContentType: contentType
        });

        try {
            const response = await this.s3Client.send(command);
            console.log('Object put successfully: ', response);
        } catch(err) {
            console.log('Error on put object: ', err);
        }
    }


}
