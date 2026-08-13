import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { Organization } from './organization.entity';
import { Role } from './role.entity';
import { Menu } from './menu.entity';
import { Notification } from './notification.entity';
import { Permission } from './permission.entity';
import { RoleService } from './role.service';
import { MenuService } from './menu.service';
import { NotificationService } from './notification.service';
import { PermissionService } from './permission.service';
import { RoleController } from './role.controller';
import { MenuController } from './menu.controller';
import { NotificationController } from './notification.controller';
import { PermissionController } from './permission.controller';
// 个人中心模块（在线模板/最近关注/VIP记录）
import { OnlineTemplate } from './online-template.entity';
import { RecentConcern } from './recent-concern.entity';
import { VipSubscription } from '../order/vip-subscription.entity';
import { UserProfileService } from './user-profile.service';
import { UserProfileController } from './user-profile.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Organization,
      Role,
      Menu,
      Notification,
      Permission,
      // 个人中心实体
      OnlineTemplate,
      RecentConcern,
      VipSubscription,
    ]),
  ],
  providers: [UserService, RoleService, MenuService, NotificationService, PermissionService, UserProfileService],
  controllers: [UserController, RoleController, MenuController, NotificationController, PermissionController, UserProfileController],
  exports: [UserService, RoleService, MenuService, NotificationService, PermissionService],
})
export class UserModule {}
