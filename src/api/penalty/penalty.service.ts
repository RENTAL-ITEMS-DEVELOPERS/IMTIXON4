import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/core/entity/order.entity';
import { OrderStatus } from 'src/common/enum/index';
import { Penalty } from 'src/core/entity/penalty.entity';
import { Repository, LessThan } from 'typeorm';
import { CreatePenaltyDto } from './dto/create-penalty.dto';

@Injectable()
export class PenaltyService {
  private readonly logger = new Logger(PenaltyService.name);
  private readonly DAY_MS = 1000 * 60 * 60 * 24;
  private readonly DAILY_PERCENT = 0.05;

  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Penalty) private penaltyRepo: Repository<Penalty>,
  ) {}

  async create(dto: CreatePenaltyDto) {
    const penalty = this.penaltyRepo.create(dto);
    return this.penaltyRepo.save(penalty);
  }

  @Cron('0 1 * * *', { timeZone: 'Asia/Tashkent' })
  async handleDailyPenalty() {
    const now = new Date();

    const overdueOrders = await this.orderRepo.find({
      where: { status: OrderStatus.CONFIRMED, end_date: LessThan(now) },
      relations: ['client'],
    });

    for (const order of overdueOrders) {
      const diffDays = Math.floor(
        (now.getTime() - order.end_date.getTime()) / this.DAY_MS,
      );
      if (diffDays <= 0) continue;

      await this.penaltyRepo.manager.transaction(async (manager) => {
        const penaltyRepo = manager.getRepository(Penalty);

        const existing = await penaltyRepo
          .createQueryBuilder('p')
          .where('p.order_id = :orderId', { orderId: order.id })
          .getOne();

        const perDayAmount = Math.round(
          Number(order.amount_sum) * this.DAILY_PERCENT,
        );

        if (!existing) {
          const p = penaltyRepo.create({
            order,
            client: order.client_id,
            amount: perDayAmount * diffDays,
            days: diffDays,
            reason: `Overdue ${diffDays} day(s) — 5% daily`,
          });
          await penaltyRepo.save(p);
          this.logger.log(
            `Order ${order.id}: created penalty rows for ${diffDays} day(s), amount=${p.amount}`,
          );
        } else {
          const missing = diffDays - existing.days;
          if (missing > 0) {
            existing.amount = Number(existing.amount) + perDayAmount * missing;
            existing.days = existing.days + missing;
            existing.reason = `Updated: +${missing} day(s) (${perDayAmount} each)`;
            await penaltyRepo.save(existing);
            this.logger.log(
              `Order ${order.id}: updated penalty +${missing} day(s), added=${perDayAmount * missing}`,
            );
          } else {
            this.logger.log(
              `Order ${order.id}: no new overdue days (diffDays=${diffDays}, recorded=${existing.days})`,
            );
          }
        }
      });
    }

    this.logger.log('Daily penalty job finished at ' + now.toISOString());
  }

  async findAll() {
    return this.penaltyRepo.find({
      relations: ['client', 'order'],
    });
  }

  async findOne(id: string) {
    const penalty = await this.penaltyRepo.findOne({
      where: { id },
      relations: ['client', 'order'],
    });
    if (!penalty) throw new NotFoundException('Penalty not found');
    return penalty;
  }

  async remove(id: string) {
    const penalty = await this.penaltyRepo.findOne({ where: { id } });
    if (!penalty) throw new NotFoundException('Penalty not found');
    return this.penaltyRepo.remove(penalty);
  }
}
