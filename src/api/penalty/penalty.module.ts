import { Module } from '@nestjs/common';
import { PenaltyService } from './penalty.service';
import { PenaltyController } from './penalty.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { Penalty } from 'src/core/entity/penalty.entity';
import { Order } from 'src/core/entity/order.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Penalty, Order]),
    ScheduleModule.forRoot(),
  ],

  controllers: [PenaltyController],
  providers: [PenaltyService],
})
export class PenaltyModule {}
