import { Module } from '@nestjs/common';
import { DaoService } from './dao.service';

@Module({
  providers: [DaoService],
})
export class DaoModule {}
