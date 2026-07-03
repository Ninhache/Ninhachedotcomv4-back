import { Injectable } from '@nestjs/common';
import { CompanyService } from 'src/company/company.service';
import { EducationService } from 'src/education/education.service';
import { MissionService } from 'src/mission/mission.service';
import { PositionService } from 'src/position/position.service';

/**
 * Aggregates the three timeline data sources into one payload so the public
 * site fetches the whole timeline in a single request. Visibility filtering is
 * left to the frontend (matching the existing projects convention).
 */
@Injectable()
export class TimelineService {
    constructor(
        private readonly companyService: CompanyService,
        private readonly missionService: MissionService,
        private readonly educationService: EducationService,
        private readonly positionService: PositionService
    ) {}

    async getTimeline() {
        const [companies, missions, educations, positions] = await Promise.all([
            this.companyService.findAll(),
            this.missionService.findAll(),
            this.educationService.findAll(),
            this.positionService.findAll(),
        ]);

        return { companies, missions, educations, positions };
    }
}
