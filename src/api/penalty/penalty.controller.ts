import { Controller, Get, Param, Delete, Post, Body } from '@nestjs/common';
import { PenaltyService } from './penalty.service';
import { CreatePenaltyDto } from './dto/create-penalty.dto';

@Controller('penalties')
export class PenaltyController {
  constructor(private readonly penaltyService: PenaltyService) {}

  @Post()
  async create(@Body() dto: CreatePenaltyDto) {
    return this.penaltyService.create(dto);
  }

  @Get()
  async findAll() {
    const penalties = await this.penaltyService.findAll();
    return penalties.map((p) => ({
      id: p.id,
      amount: p.amount,
      days: p.days,
      reason: p.reason,
      client: {
        id: p.client.id,
        fullName: (p.client as any).full_name,
      },
      order: {
        id: p.order.id,
        endDate: (p.order as any).end_date,
      },
      createdAt: p.createdAt,
    }));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const p = await this.penaltyService.findOne(id);
    return {
      id: p.id,
      amount: p.amount,
      days: p.days,
      reason: p.reason,
      client: {
        id: p.client.id,
        fullName: (p.client as any).full_name,
      },
      order: {
        id: p.order.id,
        endDate: (p.order as any).end_date,
      },
      createdAt: p.createdAt,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.penaltyService.remove(id);
    return { message: 'Penalty successfully deleted' };
  }
}
