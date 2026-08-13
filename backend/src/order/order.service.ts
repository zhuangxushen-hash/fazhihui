import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, ORDER_STATUS } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Payment, PAYMENT_STATUS } from './payment.entity';
import { VipSubscription, VIP_PLAN, VIP_STATUS } from './vip-subscription.entity';

// VIP套餐定价表（元）
export const VIP_PLAN_PRICES: Record<string, { price: number; months: number; label: string }> = {
  [VIP_PLAN.MONTH]: { price: 29.9, months: 1, label: '月卡' },
  [VIP_PLAN.QUARTER]: { price: 79.9, months: 3, label: '季卡' },
  [VIP_PLAN.HALF_YEAR]: { price: 149.9, months: 6, label: '半年卡' },
  [VIP_PLAN.YEAR]: { price: 269.9, months: 12, label: '年卡' },
};

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(VipSubscription)
    private vipSubscriptionRepository: Repository<VipSubscription>,
    private dataSource: DataSource,
  ) {}

  // 生成订单编号：ORD + 日期 + 4位序号
  private async generateOrderNo(orgId: string): Promise<string> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `ORD${dateStr}`;
    const count = await this.orderRepository
      .createQueryBuilder('o')
      .where('o.order_no LIKE :prefix', { prefix: `${prefix}%` })
      .andWhere('o.organization_id = :orgId', { orgId })
      .getCount();
    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }

  // 生成支付流水号：PAY + 日期 + 4位序号
  private async generatePaymentNo(orgId: string): Promise<string> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `PAY${dateStr}`;
    const count = await this.paymentRepository
      .createQueryBuilder('p')
      .where('p.payment_no LIKE :prefix', { prefix: `${prefix}%` })
      .andWhere('p.organization_id = :orgId', { orgId })
      .getCount();
    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }

  /**
   * 创建订单（含订单明细）
   * @param items 商品明细 [{item_name, item_type, unit_price, quantity}]
   */
  async createOrder(data: {
    user_id: string;
    title: string;
    order_type?: string;
    items: Array<{ item_name: string; item_type?: string; unit_price: number; quantity?: number }>;
    remark?: string;
    organization_id: string;
  }): Promise<{ order: Order; items: OrderItem[] }> {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('订单商品明细不能为空');
    }
    const totalAmount = data.items.reduce(
      (sum, item) => sum + (Number(item.unit_price) || 0) * (Number(item.quantity) || 1),
      0,
    );

    return this.dataSource.transaction(async (manager) => {
      const orderNo = await this.generateOrderNo(data.organization_id);
      const order = manager.create(Order, {
        order_no: orderNo,
        user_id: data.user_id,
        order_type: data.order_type || 'product',
        title: data.title,
        total_amount: totalAmount,
        status: ORDER_STATUS.PENDING,
        remark: data.remark,
        organization_id: data.organization_id,
      });
      const savedOrder = await manager.save(Order, order);

      const savedItems: OrderItem[] = [];
      for (const item of data.items) {
        const orderItem = manager.create(OrderItem, {
          order_id: savedOrder.id,
          item_name: item.item_name,
          item_type: item.item_type || null,
          unit_price: Number(item.unit_price) || 0,
          quantity: Number(item.quantity) || 1,
          amount: (Number(item.unit_price) || 0) * (Number(item.quantity) || 1),
        });
        savedItems.push(await manager.save(OrderItem, orderItem));
      }

      return { order: savedOrder, items: savedItems };
    });
  }

  /**
   * 查询订单列表
   */
  async getOrders(
    orgId: string,
    filters: { status?: string; order_type?: string; user_id?: string; page?: number; page_size?: number },
  ): Promise<{ data: Order[]; total: number }> {
    const qb = this.orderRepository
      .createQueryBuilder('o')
      .where('o.organization_id = :orgId', { orgId });
    if (filters.status) {
      qb.andWhere('o.status = :status', { status: filters.status });
    }
    if (filters.order_type) {
      qb.andWhere('o.order_type = :type', { type: filters.order_type });
    }
    if (filters.user_id) {
      qb.andWhere('o.user_id = :userId', { userId: filters.user_id });
    }
    qb.orderBy('o.created_at', 'DESC');

    const page = Number(filters.page) || 1;
    const pageSize = Number(filters.page_size) || 20;
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  /**
   * 查询订单详情（含明细与支付记录）
   */
  async getOrderById(id: string): Promise<{ order: Order; items: OrderItem[]; payments: Payment[] }> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    const items = await this.orderItemRepository.find({
      where: { order_id: id },
      order: { created_at: 'ASC' },
    });
    const payments = await this.paymentRepository.find({
      where: { order_id: id },
      order: { created_at: 'DESC' },
    });
    return { order, items, payments };
  }

  /**
   * 支付订单：创建支付记录并更新订单状态
   */
  async payOrder(
    id: string,
    data: { method: string; transaction_id?: string; payer_id?: string; organization_id: string },
  ): Promise<{ order: Order; payment: Payment }> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    if (order.status !== ORDER_STATUS.PENDING) {
      throw new BadRequestException('仅待支付状态的订单可以支付');
    }

    return this.dataSource.transaction(async (manager) => {
      // 创建支付记录（模拟支付成功）
      const paymentNo = await this.generatePaymentNo(data.organization_id);
      const payment = manager.create(Payment, {
        order_id: order.id,
        payment_no: paymentNo,
        amount: Number(order.total_amount),
        method: data.method,
        status: PAYMENT_STATUS.SUCCESS,
        transaction_id: data.transaction_id || null,
        paid_at: new Date(),
        payer_id: data.payer_id || null,
        organization_id: data.organization_id,
      });
      const savedPayment = await manager.save(Payment, payment);

      // 更新订单状态为已支付
      await manager.update(Order, order.id, {
        status: ORDER_STATUS.PAID,
        pay_method: data.method,
        pay_time: new Date(),
      });

      const updatedOrder = await manager.findOne(Order, { where: { id: order.id } });
      return { order: updatedOrder, payment: savedPayment };
    });
  }

  /**
   * 取消订单（仅待支付状态）
   */
  async cancelOrder(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    if (order.status !== ORDER_STATUS.PENDING) {
      throw new BadRequestException('仅待支付状态的订单可以取消');
    }
    await this.orderRepository.update(id, { status: ORDER_STATUS.CANCELLED });
    return this.orderRepository.findOne({ where: { id } });
  }

  /**
   * VIP 订阅：根据套餐创建订单并自动完成支付、开通订阅
   */
  async subscribeVip(data: {
    user_id: string;
    plan_type: string;
    pay_method: string;
    organization_id: string;
  }): Promise<{ order: Order; subscription: VipSubscription; payment: Payment }> {
    const plan = VIP_PLAN_PRICES[data.plan_type];
    if (!plan) {
      throw new BadRequestException('无效的VIP套餐类型');
    }

    // 创建VIP订单并支付
    const { order } = await this.createOrder({
      user_id: data.user_id,
      title: `VIP会员-${plan.label}`,
      order_type: 'vip',
      items: [
        {
          item_name: `VIP会员${plan.label}（${plan.months}个月）`,
          item_type: `vip_${data.plan_type}`,
          unit_price: plan.price,
          quantity: 1,
        },
      ],
      organization_id: data.organization_id,
    });

    const { order: paidOrder, payment } = await this.payOrder(order.id, {
      method: data.pay_method,
      payer_id: data.user_id,
      organization_id: data.organization_id,
    });

    // 开通VIP订阅：若已有生效中的订阅则顺延，否则从今天开始
    const existingActive = await this.vipSubscriptionRepository
      .createQueryBuilder('v')
      .where('v.user_id = :userId', { userId: data.user_id })
      .andWhere('v.status = :status', { status: VIP_STATUS.ACTIVE })
      .orderBy('v.end_date', 'DESC')
      .getOne();

    let startDate = new Date();
    if (existingActive && existingActive.end_date) {
      const end = new Date(existingActive.end_date);
      if (end > startDate) {
        startDate = end;
      }
    }

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + plan.months);

    const subscription = this.vipSubscriptionRepository.create({
      user_id: data.user_id,
      order_id: order.id,
      plan_type: data.plan_type,
      months: plan.months,
      amount: plan.price,
      start_date: startDate.toISOString().slice(0, 10),
      end_date: endDate.toISOString().slice(0, 10),
      status: VIP_STATUS.ACTIVE,
      organization_id: data.organization_id,
    });
    const savedSubscription = await this.vipSubscriptionRepository.save(subscription);

    // 订单标记为已完成
    await this.orderRepository.update(order.id, { status: ORDER_STATUS.COMPLETED });
    paidOrder.status = ORDER_STATUS.COMPLETED;

    return { order: paidOrder, subscription: savedSubscription, payment };
  }

  /**
   * 查询VIP订阅列表
   */
  async getVipSubscriptions(
    orgId: string,
    filters: { status?: string; user_id?: string; page?: number; page_size?: number },
  ): Promise<{ data: VipSubscription[]; total: number }> {
    const qb = this.vipSubscriptionRepository
      .createQueryBuilder('v')
      .where('v.organization_id = :orgId', { orgId });
    if (filters.status) {
      qb.andWhere('v.status = :status', { status: filters.status });
    }
    if (filters.user_id) {
      qb.andWhere('v.user_id = :userId', { userId: filters.user_id });
    }
    qb.orderBy('v.created_at', 'DESC');

    const page = Number(filters.page) || 1;
    const pageSize = Number(filters.page_size) || 20;
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  /**
   * 订单统计（概览卡片）
   */
  async getOrderStats(orgId: string): Promise<{
    total_count: number;
    paid_count: number;
    pending_count: number;
    total_amount: number;
    paid_amount: number;
    vip_count: number;
  }> {
    const qb = this.orderRepository
      .createQueryBuilder('o')
      .where('o.organization_id = :orgId', { orgId });

    const [totalCount, paidCount, pendingCount, totalAmount, paidAmount, vipCount] =
      await Promise.all([
        qb.clone().getCount(),
        qb.clone().andWhere('o.status IN (:...statuses)', { statuses: [ORDER_STATUS.PAID, ORDER_STATUS.COMPLETED] }).getCount(),
        qb.clone().andWhere('o.status = :s', { s: ORDER_STATUS.PENDING }).getCount(),
        qb.clone().select('COALESCE(SUM(o.total_amount), 0)', 'total').getRawOne().then((r) => Number(r?.total || 0)),
        qb.clone().andWhere('o.status IN (:...statuses)', { statuses: [ORDER_STATUS.PAID, ORDER_STATUS.COMPLETED] }).select('COALESCE(SUM(o.total_amount), 0)', 'total').getRawOne().then((r) => Number(r?.total || 0)),
        qb.clone().andWhere('o.order_type = :t', { t: 'vip' }).getCount(),
      ]);

    return {
      total_count: totalCount,
      paid_count: paidCount,
      pending_count: pendingCount,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      vip_count: vipCount,
    };
  }
}
