import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = NestFactory.create(AppModule);
  const PORT = process.env.PORT || 3000;
  (await app).listen(PORT, () => {
    console.log(`Port: ${PORT}`);
  })
}

bootstrap();