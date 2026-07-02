import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { EducationService } from './education.service';

describe('EducationService', () => {
    let service: EducationService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EducationService,
                { provide: PrismaService, useValue: {} },
            ],
        }).compile();

        service = module.get<EducationService>(EducationService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
