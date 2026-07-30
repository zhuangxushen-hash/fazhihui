import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from './menu.entity';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
  ) {}

  async create(menuData: Partial<Menu>): Promise<Menu> {
    const menu = this.menuRepository.create(menuData);
    return this.menuRepository.save(menu);
  }

  async findAll(): Promise<Menu[]> {
    return this.menuRepository.find({
      order: { sort_order: 'ASC' },
    });
  }

  async getMenuTree(): Promise<any[]> {
    const menus = await this.menuRepository.find({
      where: { is_visible: true },
      order: { sort_order: 'ASC' },
    });
    
    const menuMap = new Map();
    const rootMenus = [];

    for (const menu of menus) {
      menuMap.set(menu.id, { ...menu, children: [] });
    }

    for (const menu of menus) {
      const menuNode = menuMap.get(menu.id);
      if (menu.parent_id && menuMap.has(menu.parent_id)) {
        menuMap.get(menu.parent_id).children.push(menuNode);
      } else {
        rootMenus.push(menuNode);
      }
    }

    return rootMenus;
  }

  async findById(id: string): Promise<Menu> {
    return this.menuRepository.findOne({ where: { id } });
  }

  async update(id: string, menuData: Partial<Menu>): Promise<Menu> {
    await this.menuRepository.update(id, menuData);
    return this.menuRepository.findOne({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.menuRepository.delete(id);
  }

  async toggleVisibility(id: string): Promise<Menu> {
    const menu = await this.menuRepository.findOne({ where: { id } });
    menu.is_visible = !menu.is_visible;
    return this.menuRepository.save(menu);
  }
}
