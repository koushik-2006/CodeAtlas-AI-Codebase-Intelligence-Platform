export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  error: string;
  statusCode: number;
  details?: string;
}

export interface OCRExtractionResult {
  code: string;
  confidence: number;
  languageDetected?: string;
  lineCount: number;
}
