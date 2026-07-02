import { Test, TestingModule } from '@nestjs/testing';
import { CompanyService } from 'src/company/company.service';
import { EducationService } from 'src/education/education.service';
import { MissionService } from 'src/mission/mission.service';
import { PositionService } from 'src/position/position.service';
import { TimelineService } from './timeline.service';

describe('TimelineService', () => {
    let service: TimelineService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TimelineService,
                { provide: CompanyService, useValue: {} },
                { provide: MissionService, useValue: {} },
                { provide: EducationService, useValue: {} },
                { provide: PositionService, useValue: {} },
            ],
        }).compile();

        service = module.get<TimelineService>(TimelineService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
