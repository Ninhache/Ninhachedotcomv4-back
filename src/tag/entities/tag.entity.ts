export class Tag {
  id: string;
  name: string;
  type: TagType;
}

export enum TagType {
  TECH = 'TECH',
  QUAL = 'QUAL',
  SKILL_CATEGORY = 'SKILL_CATEGORY',
  EXPERIENCE_TECH = 'EXPERIENCE_TECH',
}
