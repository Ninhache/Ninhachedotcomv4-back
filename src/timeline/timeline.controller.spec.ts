import { Test, TestingModule } from '@nestjs/testing';
import { AliasService } from 'src/alias/alias.service';
import { TimelineController } from './timeline.controller';
import { TimelineService } from './timeline.service';

describe('TimelineController', () => {
    let controller: TimelineController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TimelineController],
            providers: [
                { provide: TimelineService, useValue: {} },
                { provide: AliasService, useValue: {} },
            ],
        }).compile();

        controller = module.get<TimelineController>(TimelineController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
