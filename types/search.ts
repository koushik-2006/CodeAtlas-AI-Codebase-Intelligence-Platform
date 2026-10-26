export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: "repository" | "file" | "symbol" | "api" | "architecture" | "review" | "doc";
  repositoryId?: string;
  repositoryName?: string;
  filePath?: string;
  line?: number;
  matchSnippet?: string;
  href: string;
  badge?: string;
  symbolType?: string;
}

export interface SearchCategoryCount {
  category: string;
  label: string;
  count: number;
}

export interface GlobalSearchResponse {
  query: string;
  total: number;
  results: SearchResultItem[];
  categories: SearchCategoryCount[];
  recentSearches: string[];
}
