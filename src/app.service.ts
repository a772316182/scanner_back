import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  generateUUID(): string {
    return `${this.getYYDDMMHHMM()}-${crypto.randomUUID()}`;
  }

  private getYYDDMMHHMM(date = new Date()): string {
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return year + month + day + hours + minutes;
  }
}
