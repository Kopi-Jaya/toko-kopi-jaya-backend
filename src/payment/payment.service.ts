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
import { OrderStatus, PaymentMethod, PaymentStatus } from '../common/enums';

export interface PaymentWithChange extends Payment {
  change?: number;
}

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async create(dto: CreatePaymentDto): Promise<PaymentWithChange> {
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

    // Cash is settled at the till, not via an external gateway, so it short-
    // circuits straight to SUCCESS. Per the order spec, this also advances
    // the order to PAID, which fires trg_credit_points_after_payment and
    // unblocks the preparing → ready_for_pickup → completed transitions.
    const isCash = dto.payment_method === PaymentMethod.CASH;
    const now = new Date();

    // Validate and compute change for Tunai (cash) payments.
    let change: number | undefined;
    if (isCash && dto.cash_received != null) {
      const orderTotal = Number(order.total_final);
      if (dto.cash_received < orderTotal) {
        throw new BadRequestException(
          `Cash received (${dto.cash_received}) is less than order total (${orderTotal})`,
        );
      }
      change = dto.cash_received - orderTotal;
    }

    const payment = this.paymentRepository.create({
      order_id: dto.order_id,
      payment_method: dto.payment_method,
      amount: dto.amount,
      status: isCash ? PaymentStatus.SUCCESS : PaymentStatus.PENDING,
      paid_at: isCash ? now : null,
    });

    const saved = await this.paymentRepository.save(payment);

    if (isCash) {
      await this.orderRepository.update(dto.order_id, {
        status: OrderStatus.PAID,
        paid_at: now,
      });
    }

    const result: PaymentWithChange = Object.assign(saved, { change });
    return result;
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

  /** Cashier manually confirms a QRIS payment has been received. */
  async confirmQris(paymentId: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { payment_id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    if (payment.payment_method !== PaymentMethod.QRIS) {
      throw new BadRequestException(
        `Payment ${paymentId} is not a QRIS payment (method: ${payment.payment_method})`,
      );
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        `Payment ${paymentId} is not pending. Current status: "${payment.status}"`,
      );
    }

    return this.updateStatus(paymentId, PaymentStatus.SUCCESS);
  }
}
