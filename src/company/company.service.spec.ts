import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { CompanyService } from './company.service';

describe('CompanyService', () => {
    let service: CompanyService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CompanyService,
                { provide: PrismaService, useValue: {} },
            ],
        }).compile();

        service = module.get<CompanyService>(CompanyService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
