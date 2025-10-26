export interface HistoryItem {
  id: number;
  type: 'command' | 'output';
  text: string;
  prompt?: string;
}

export type FSNode = Directory | File;

export interface Directory {
  type: 'directory';
  children: { [key: string]: FSNode };
}

export interface File {
  type: 'file';
  content: string;
}

export type FileSystem = Directory;
