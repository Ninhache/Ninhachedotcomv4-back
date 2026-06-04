import { Tag } from 'src/tags/entities/tag.entity';

export class Skill {
  id: string;
  name: string;
  image: string;
  wikiUrl?: string;
  tags: Tag[];
}
