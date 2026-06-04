import { Test, TestingModule } from '@nestjs/testing';
import { AliasService } from 'src/alias/alias.service';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';

describe('ContactController', () => {
  let controller: ContactController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactController],
      providers: [
        { provide: ContactService, useValue: {} },
        { provide: AliasService, useValue: {} },
      ],
    }).compile();

    controller = module.get<ContactController>(ContactController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
