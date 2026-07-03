import { ProjectNature } from '@prisma/client';
import { Media } from 'src/media/entities/media.entity';
import { Skill } from 'src/skill/entities/skill.entity';

export class Project {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date | null;
  gitUrl?: string;
  visitUrl?: string;
  skills: Skill[];
  natures: ProjectNature[];
  media: Media[];
}
