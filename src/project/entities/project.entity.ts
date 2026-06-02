import { Media } from 'src/media/entities/media.entity';
import { Tag } from 'src/tags/entities/tag.entity';

export class Project {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date | null;
  gitUrl?: string;
  visitUrl?: string;
  techTags: Tag[];
  qualTags: Tag[];
  media: Media[];
}
