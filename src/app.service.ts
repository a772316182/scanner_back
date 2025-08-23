import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'SCANNER BACK END SERVER IS RUNNING...';
  }
}
