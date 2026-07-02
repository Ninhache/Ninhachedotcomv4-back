import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { PositionService } from './position.service';

describe('PositionService', () => {
    let service: PositionService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PositionService,
                { provide: PrismaService, useValue: {} },
            ],
        }).compile();

        service = module.get<PositionService>(PositionService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
