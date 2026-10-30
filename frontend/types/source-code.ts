export interface SourceFileNode {
  name: string;
  type: "file" | "folder";
  path: string;
  language?: string;
  content?: string;
  size?: number;
  children?: SourceFileNode[];
}

export interface CodeHighlightRange {
  startLine: number;
  endLine: number;
}

export interface SourceCitation {
  file?: string;
  filePath?: string;
  lineRange?: string;
  startLine?: number;
  endLine?: number;
  previewCode?: string;
  isConfirmed?: boolean;
}
