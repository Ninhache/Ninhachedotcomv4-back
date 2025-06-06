export class Media {
  id: string;
  url: string;
  type: MediaType;
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}
