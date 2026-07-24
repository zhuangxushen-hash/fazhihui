import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiveCode } from './live-code.entity';
import { ChannelTracking } from './channel-tracking.entity';
import { ClientTag } from './client-tag.entity';
import { ClientTagRelation } from './client-tag-relation.entity';
import { ScriptLibrary } from './script-library.entity';
import { ReachTask } from './reach-task.entity';
import { ChatArchive } from './chat-archive.entity';
import { Lead } from '../lead/lead.entity';
import { FollowUp } from '../lead/follow-up.entity';
import { Case } from '../case/case.entity';
import { User } from '../user/user.entity';

import { LiveCodeService } from './live-code.service';
import { LiveCodeController } from './live-code.controller';
import { ChannelTrackingService } from './channel-tracking.service';
import { ChannelTrackingController } from './channel-tracking.controller';
import { ClientTagService } from './client-tag.service';
import { ClientTagController } from './client-tag.controller';
import { ScriptLibraryService } from './script-library.service';
import { ScriptLibraryController } from './script-library.controller';
import { SidebarService } from './sidebar.service';
import { SidebarController } from './sidebar.controller';
import { ReachTaskService } from './reach-task.service';
import { ReachTaskController } from './reach-task.controller';
import { ChatArchiveService } from './chat-archive.service';
import { ChatArchiveController } from './chat-archive.controller';

import { ComplianceModule } from '../compliance/compliance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LiveCode,
      ChannelTracking,
      ClientTag,
      ClientTagRelation,
      ScriptLibrary,
      ReachTask,
      ChatArchive,
      Lead,
      FollowUp,
      Case,
      User,
    ]),
    ComplianceModule,
  ],
  providers: [
    LiveCodeService,
    ChannelTrackingService,
    ClientTagService,
    ScriptLibraryService,
    SidebarService,
    ReachTaskService,
    ChatArchiveService,
  ],
  controllers: [
    LiveCodeController,
    ChannelTrackingController,
    ClientTagController,
    ScriptLibraryController,
    SidebarController,
    ReachTaskController,
    ChatArchiveController,
  ],
})
export class ScrmModule {}
