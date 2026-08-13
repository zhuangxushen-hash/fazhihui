import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from './payment.entity';
import { VipSubscription } from './vip-subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Payment, VipSubscription])],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
