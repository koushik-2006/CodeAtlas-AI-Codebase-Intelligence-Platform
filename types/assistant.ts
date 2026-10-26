export interface CitationReference {
  file: string;
  lineRange?: string;
  startLine?: number;
  endLine?: number;
  symbol?: string;
  reason?: string;
}

export interface AssistantMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  citations?: (string | CitationReference)[];
  confirmedFacts?: string[];
  inferredFacts?: string[];
  unavailableInfo?: string[];
  confidence?: "supported" | "inferred" | "unsupported";
  limitations?: string[];
  isError?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  repositoryId: string;
  createdAt: string;
  updatedAt: string;
  messages: AssistantMessage[];
}

export interface AssistantQueryRequest {
  repositoryId: string;
  question: string;
  activeFilePath?: string;
  selectedLineRange?: [number, number];
  conversationId?: string;
}
