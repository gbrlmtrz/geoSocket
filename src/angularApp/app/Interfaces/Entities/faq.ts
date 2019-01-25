import Entity from "../entity";

export default interface FAQ extends Entity{
  readonly name: string;
  readonly searchName: string;
  readonly category: number;
  readonly communityLink: string;
  readonly tags: string;
  readonly searchTags: string;
  readonly body: string;
  readonly searchBody: string;
  readonly lang: string;
  rate?: number;
}