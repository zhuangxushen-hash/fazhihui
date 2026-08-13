import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { OrderService, VIP_PLAN_PRICES } from './order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types';

@Controller('order')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.FINANCE)
export class OrderController {
  constructor(private orderService: OrderService) {}

  // 创建订单
  @Post('create')
  createOrder(
    @Body() body: {
      user_id: string;
      title: string;
      order_type?: string;
      items: Array<{ item_name: string; item_type?: string; unit_price: number; quantity?: number }>;
      remark?: string;
    },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.orderService.createOrder({
      ...body,
      organization_id: organizationId,
    });
  }

  // 订单列表
  @Get('list')
  getOrders(
    @Query('status') status: string,
    @Query('order_type') orderType: string,
    @Query('user_id') userId: string,
    @Query('page') page: string,
    @Query('page_size') pageSize: string,
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.orderService.getOrders(organizationId, {
      status,
      order_type: orderType,
      user_id: userId,
      page: page ? Number(page) : undefined,
      page_size: pageSize ? Number(pageSize) : undefined,
    });
  }

  // 订单详情
  @Get('detail/:id')
  getOrderById(@Param('id') id: string) {
    return this.orderService.getOrderById(id);
  }

  // 支付订单
  @Post('pay')
  payOrder(
    @Body() body: { id: string; method: string; transaction_id?: string },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.orderService.payOrder(body.id, {
      method: body.method,
      transaction_id: body.transaction_id,
      payer_id: req?.user?.id,
      organization_id: organizationId,
    });
  }

  // 取消订单
  @Post('cancel')
  cancelOrder(@Body() body: { id: string }) {
    return this.orderService.cancelOrder(body.id);
  }

  // VIP 套餐价格表
  @Get('vip/plans')
  getVipPlans() {
    return {
      plans: Object.entries(VIP_PLAN_PRICES).map(([key, value]) => ({
        plan_type: key,
        label: value.label,
        price: value.price,
        months: value.months,
      })),
    };
  }

  // VIP 订阅
  @Post('vip/subscribe')
  subscribeVip(
    @Body() body: { user_id: string; plan_type: string; pay_method: string },
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.orderService.subscribeVip({
      user_id: body.user_id,
      plan_type: body.plan_type,
      pay_method: body.pay_method,
      organization_id: organizationId,
    });
  }

  // VIP 订阅列表
  @Get('vip/list')
  getVipSubscriptions(
    @Query('status') status: string,
    @Query('user_id') userId: string,
    @Query('page') page: string,
    @Query('page_size') pageSize: string,
    @Request() req?: any,
  ) {
    const organizationId = req?.user?.organization_id;
    return this.orderService.getVipSubscriptions(organizationId, {
      status,
      user_id: userId,
      page: page ? Number(page) : undefined,
      page_size: pageSize ? Number(pageSize) : undefined,
    });
  }

  // 订单统计
  @Get('stats')
  getOrderStats(@Request() req?: any) {
    const organizationId = req?.user?.organization_id;
    return this.orderService.getOrderStats(organizationId);
  }
}
