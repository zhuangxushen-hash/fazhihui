import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScriptLibrary } from './script-library.entity';

@Injectable()
export class ScriptLibraryService {
  constructor(
    @InjectRepository(ScriptLibrary)
    private scriptLibraryRepository: Repository<ScriptLibrary>,
  ) {}

  async create(data: Partial<ScriptLibrary>): Promise<ScriptLibrary> {
    if (Array.isArray(data.material_ids)) {
      data.material_ids = JSON.stringify(data.material_ids);
    }
    const entity = this.scriptLibraryRepository.create(data);
    return this.scriptLibraryRepository.save(entity);
  }

  async findAll(orgId?: string, filters?: {
    category?: string;
  }): Promise<ScriptLibrary[]> {
    const where: any = {};
    if (orgId) where.organization_id = orgId;
    if (filters?.category) where.category = filters.category;
    return this.scriptLibraryRepository.find({ where, order: { created_at: 'DESC' } });
  }

  async findById(id: string): Promise<ScriptLibrary> {
    const script = await this.scriptLibraryRepository.findOne({ where: { id } });
    if (!script) {
      throw new NotFoundException('话术不存在');
    }
    return script;
  }

  async update(id: string, data: Partial<ScriptLibrary>): Promise<ScriptLibrary> {
    if (Array.isArray(data.material_ids)) {
      data.material_ids = JSON.stringify(data.material_ids);
    }
    await this.scriptLibraryRepository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.scriptLibraryRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('话术不存在');
    }
  }

  /**
   * 一键发送话术(模拟企微侧边栏发送)
   * 返回发送结果
   */
  async sendScript(id: string, body: {
    client_id: string;
    employee_id: string;
  }): Promise<{ success: boolean; script: ScriptLibrary; sent_at: Date }> {
    const script = await this.findById(id);
    // 实际场景下应调用企微开放接口发送, 此处仅返回模拟结果
    return {
      success: true,
      script,
      sent_at: new Date(),
    };
  }
}
