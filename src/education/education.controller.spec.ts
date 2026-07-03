import { Test, TestingModule } from '@nestjs/testing';
import { AliasService } from 'src/alias/alias.service';
import { EducationController } from './education.controller';
import { EducationService } from './education.service';

describe('EducationController', () => {
    let controller: EducationController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [EducationController],
            providers: [
                { provide: EducationService, useValue: {} },
                { provide: AliasService, useValue: {} },
            ],
        }).compile();

        controller = module.get<EducationController>(EducationController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
