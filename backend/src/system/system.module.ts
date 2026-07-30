import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeploymentConfig } from './deployment-config.entity';
import { BrandConfig } from './brand-config.entity';
import { Integration } from './integration.entity';
import { DeploymentConfigService } from './deployment-config.service';
import { BrandConfigService } from './brand-config.service';
import { IntegrationService } from './integration.service';
import { DeploymentConfigController } from './deployment-config.controller';
import { BrandConfigController } from './brand-config.controller';
import { IntegrationController } from './integration.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DeploymentConfig, BrandConfig, Integration])],
  providers: [DeploymentConfigService, BrandConfigService, IntegrationService],
  controllers: [DeploymentConfigController, BrandConfigController, IntegrationController],
  exports: [DeploymentConfigService, BrandConfigService, IntegrationService],
})
export class SystemModule {}
