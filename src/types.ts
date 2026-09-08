export type Status =
  | "waiting"
  | "sketch"
  | "lineart"
  | "coloring"
  | "completed";

export interface Commission {
  id: string;
  character: string;
  clientAlias?: string;
  type: string;
  progress: number;
  updatedAt: string;
  status: Status;
  image?: ImageMetadata;
  body?: string;
  entryId: string;
}

export interface ColumnConfig {
  key: Status;
  label: string;
  color: string;
}
