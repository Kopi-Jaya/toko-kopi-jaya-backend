import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderFeedback } from './entities/order-feedback.entity';
import { Order } from '../orders/entities/order.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { QueryFeedbackDto } from './dto/query-feedback.dto';
import { OrderStatus } from '../common/enums';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(OrderFeedback)
    private readonly feedbackRepository: Repository<OrderFeedback>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  /// Feedback is only meaningful once the order is fully fulfilled — an order
  /// still in progress has nothing to rate yet, and `order_id` is UNIQUE so a
  /// second submission on the same order must be rejected rather than silently
  /// overwriting the first (this is a rating record, not an editable draft).
  async createForOrder(memberId: number, orderId: number, dto: CreateFeedbackDto) {
    const order = await this.orderRepository.findOne({
      where: { order_id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (Number(order.member_id) !== Number(memberId)) {
      throw new ForbiddenException('You can only leave feedback on your own orders');
    }

    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException(
        `Feedback can only be left on completed orders. Current status: "${order.status}"`,
      );
    }

    const existing = await this.feedbackRepository.findOne({
      where: { order_id: orderId },
    });
    if (existing) {
      throw new BadRequestException('Feedback has already been submitted for this order');
    }

    const feedback = this.feedbackRepository.create({
      order_id: orderId,
      member_id: memberId,
      rating: dto.rating,
      comment: dto.comment ?? null,
    });

    return this.feedbackRepository.save(feedback);
  }

  async findAll(query: QueryFeedbackDto, scopedOutletId: number | null = null) {
    const { page = 1, limit = 20, rating, date_from, date_to } = query;
    const outlet_id = scopedOutletId ?? query.outlet_id;
    const skip = (page - 1) * limit;

    const qb = this.feedbackRepository
      .createQueryBuilder('feedback')
      .leftJoinAndSelect('feedback.order', 'order')
      .leftJoinAndSelect('order.member', 'member')
      .leftJoinAndSelect('order.outlet', 'outlet');

    if (rating) {
      qb.andWhere('feedback.rating = :rating', { rating });
    }
    if (outlet_id) {
      qb.andWhere('order.outlet_id = :outlet_id', { outlet_id });
    }
    if (date_from) {
      qb.andWhere('feedback.created_at >= :date_from', { date_from });
    }
    if (date_to) {
      qb.andWhere('feedback.created_at <= :date_to', { date_to });
    }

    qb.orderBy('feedback.created_at', 'DESC').skip(skip).take(limit);

    const [data, total_items] = await qb.getManyAndCount();
    const avgRating =
      data.length > 0
        ? data.reduce((sum, f) => sum + f.rating, 0) / data.length
        : 0;

    return {
      data,
      meta: {
        page,
        limit,
        total_items,
        total_pages: Math.ceil(total_items / limit),
        average_rating: Math.round(avgRating * 10) / 10,
      },
    };
  }

  /// Whether the caller's own order already has feedback — used by the mobile
  /// app to decide whether to show the rating prompt (once, not a recurring nag).
  async hasFeedback(orderId: number): Promise<boolean> {
    const existing = await this.feedbackRepository.findOne({
      where: { order_id: orderId },
    });
    return !!existing;
  }
}
