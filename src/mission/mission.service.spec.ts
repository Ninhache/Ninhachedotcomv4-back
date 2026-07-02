import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { MissionService } from './mission.service';

describe('MissionService', () => {
    let service: MissionService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MissionService,
                { provide: PrismaService, useValue: {} },
            ],
        }).compile();

        service = module.get<MissionService>(MissionService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
