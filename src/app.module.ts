import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScannerModule } from './scanner/scanner.module';
import { ParserModule } from './parser/parser.module';
import { DaoModule } from './dao/dao.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScannerModule,
    ParserModule,
    DaoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
