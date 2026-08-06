import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArchiveVolume } from './archive-volume.entity';

@Injectable()
export class ArchiveVolumeService {
  constructor(
    @InjectRepository(ArchiveVolume)
    private readonly volumeRepository: Repository<ArchiveVolume>,
  ) {}

  // 创建卷宗归档记录
  async create(data: Partial<ArchiveVolume>): Promise<ArchiveVolume> {
    const volume = this.volumeRepository.create(data);
    return this.volumeRepository.save(volume);
  }

  // 分页查询卷宗列表，支持 case_id/status/borrower_id 筛选
  async findList(params: {
    organization_id: string;
    page?: number;
    pageSize?: number;
    case_id?: string;
    status?: string;
    borrower_id?: string;
  }): Promise<{ list: ArchiveVolume[]; total: number; page: number; pageSize: number }> {
    const page = Number(params.page) > 0 ? Number(params.page) : 1;
    const pageSize = Number(params.pageSize) > 0 ? Number(params.pageSize) : 10;
    const where: any = {};
    if (params.organization_id) {
      where.organization_id = params.organization_id;
    }
    if (params.case_id) {
      where.case_id = params.case_id;
    }
    if (params.status) {
      where.status = params.status;
    }
    if (params.borrower_id) {
      where.borrower_id = params.borrower_id;
    }
    const [list, total] = await this.volumeRepository.findAndCount({
      where,
      order: { updated_at: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { list, total, page, pageSize };
  }

  // 查询单条卷宗
  async findOne(id: string): Promise<ArchiveVolume> {
    return this.volumeRepository.findOne({ where: { id } });
  }

  // 更新卷宗
  async update(id: string, data: Partial<ArchiveVolume>): Promise<ArchiveVolume> {
    await this.volumeRepository.update(id, data);
    return this.volumeRepository.findOne({ where: { id } });
  }

  // 借阅申请：状态置为已借出，记录借阅人与借阅日期
  async borrow(id: string, data: Partial<ArchiveVolume>): Promise<ArchiveVolume> {
    await this.volumeRepository.update(id, {
      status: 'borrowed',
      borrower_id: data.borrower_id,
      borrow_date: data.borrow_date || new Date(),
      borrow_reason: data.borrow_reason,
    });
    return this.volumeRepository.findOne({ where: { id } });
  }

  // 上传卷宗文件
  async upload(id: string, file_url: string): Promise<ArchiveVolume> {
    await this.volumeRepository.update(id, { file_url });
    return this.volumeRepository.findOne({ where: { id } });
  }
}
