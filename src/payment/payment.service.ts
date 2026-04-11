import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { OrderStatus, PaymentStatus } from '../common/enums';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async create(dto: CreatePaymentDto): Promise<Payment> {
    const order = await this.orderRepository.findOne({
      where: { order_id: dto.order_id },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${dto.order_id} not found`);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Order is not in pending status. Current status: "${order.status}"`,
      );
    }

    const existingPayment = await this.paymentRepository.findOne({
      where: { order_id: dto.order_id },
    });

    if (existingPayment) {
      throw new BadRequestException('A payment already exists for this order');
    }

    const payment = this.paymentRepository.create({
      order_id: dto.order_id,
      payment_method: dto.payment_method,
      amount: dto.amount,
      status: PaymentStatus.PENDING,
    });

    return this.paymentRepository.save(payment);
  }

  async findByOrderId(orderId: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { order_id: orderId },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment for order ID ${orderId} not found`);
    }

    return payment;
  }

  async updateStatus(paymentId: number, status: PaymentStatus): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { payment_id: paymentId },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    payment.status = status;

    if (status === PaymentStatus.SUCCESS) {
      payment.paid_at = new Date();

      await this.orderRepository.update(payment.order_id, {
        status: OrderStatus.PAID,
        paid_at: new Date(),
      });
    }

    return this.paymentRepository.save(payment);
  }
}
