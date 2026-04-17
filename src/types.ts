export type Photo = {
  id: string;
  src: string;
  title: string;
  note: string;
  publicId: string;
  width?: number;
  height?: number;
  displayOrder: number;
};

export type Album = {
  id: string;
  isPrivate: boolean;
  year: number;
  title: string;
  eventDate: string;
  cover: string;
  coverPublicId: string;
  description: string;
  photos: Photo[];
  displayOrder: number;
};
