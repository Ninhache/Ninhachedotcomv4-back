import { Test, TestingModule } from '@nestjs/testing';
import { AliasService } from 'src/alias/alias.service';
import { SkillController } from './skill.controller';
import { SkillService } from './skill.service';

describe('SkillController', () => {
  let controller: SkillController;
  const skillService = { reorderCategories: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SkillController],
      providers: [
        { provide: SkillService, useValue: skillService },
        { provide: AliasService, useValue: {} },
      ],
    }).compile();

    controller = module.get<SkillController>(SkillController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('reorderCategories delegates the items list to the service', () => {
    const items = [
      { id: 'a', order: 0 },
      { id: 'b', order: 1 },
    ];
    controller.reorderCategories({ items });
    expect(skillService.reorderCategories).toHaveBeenCalledWith(items);
  });
});
