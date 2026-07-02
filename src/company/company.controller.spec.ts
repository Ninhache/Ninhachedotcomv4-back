import { Test, TestingModule } from '@nestjs/testing';
import { AliasService } from 'src/alias/alias.service';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';

describe('CompanyController', () => {
    let controller: CompanyController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CompanyController],
            providers: [
                { provide: CompanyService, useValue: {} },
                { provide: AliasService, useValue: {} },
            ],
        }).compile();

        controller = module.get<CompanyController>(CompanyController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
