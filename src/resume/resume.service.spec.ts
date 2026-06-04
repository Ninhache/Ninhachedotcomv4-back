import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResumeService } from './resume.service';

describe('ResumeService', () => {
  let service: ResumeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResumeService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<ResumeService>(ResumeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
