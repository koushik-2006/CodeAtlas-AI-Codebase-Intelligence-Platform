export type SymbolNavigationKind =
  | "definition"
  | "reference"
  | "caller"
  | "callee"
  | "import"
  | "implementation"
  | "test";

export interface SymbolNavigationTarget {
  id: string;
  name: string;
  kind: SymbolNavigationKind;
  file: string;
  line: number;
  endLine?: number;
  lineText: string;
  isVerified: boolean; // true = AST/relationship verified, false = text heuristic
  symbolType: string;
  previewSnippet?: string;
  reason?: string;
}

export interface SymbolNavigationResult {
  symbolName: string;
  queryFile: string;
  queryLine: number;
  definition: SymbolNavigationTarget | null;
  references: SymbolNavigationTarget[];
  callers: SymbolNavigationTarget[];
  callees: SymbolNavigationTarget[];
  imports: SymbolNavigationTarget[];
  implementations: SymbolNavigationTarget[];
  relatedTests: SymbolNavigationTarget[];
  containingModule: { file: string; line: number; name: string } | null;
  isAmbiguous: boolean;
  candidates: SymbolNavigationTarget[];
  languageSupported: boolean;
}
