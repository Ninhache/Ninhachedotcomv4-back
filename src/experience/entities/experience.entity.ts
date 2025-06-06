import { Tag } from 'src/tag/entities/tag.entity';

export class Experience {
  id: string;
  title: string;
  companyName: string;
  description: string;
  date: Date;
  siteUrl?: string;
  tags: Tag[];
}
