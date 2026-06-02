import { Test, TestingModule } from '@nestjs/testing';
import { AliasService } from 'src/alias/alias.service';
import { ExperienceController } from './experience.controller';
import { ExperienceService } from './experience.service';

describe('ExperienceController', () => {
  let controller: ExperienceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExperienceController],
      providers: [
        { provide: ExperienceService, useValue: {} },
        { provide: AliasService, useValue: {} },
      ],
    }).compile();

    controller = module.get<ExperienceController>(ExperienceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
