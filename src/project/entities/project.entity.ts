import { Media } from 'src/media/entities/media.entity';
import { Tag } from 'src/tag/entities/tag.entity';

export class Project {
  id: string;
  name: string;
  description: string;
  date: Date;
  gitUrl?: string;
  visitUrl?: string;
  techTags: Tag[];
  qualTags: Tag[];
  media: Media[];
}
