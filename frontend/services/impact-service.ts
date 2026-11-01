import { ChangeImpactResult, ImpactAnalysisRequest } from "@/types/impact";
import {
  analyzeChangeImpact,
  extractAllIndexedFiles,
  generateMarkdownReport,
  mapNaturalLanguageChange,
  parseDiffInput,
  streamAIRiskReport,
} from "@/lib/demo/impact-engine";
import { getStore } from "@/lib/demo/store";

class ImpactService {
  /**
   * Deterministically analyzes change impact locally from indexed AST store.
   * Completely offline and static-export friendly.
   */
  async analyzeImpact(request: ImpactAnalysisRequest): Promise<ChangeImpactResult> {
    return analyzeChangeImpact(request);
  }

  /**
   * Retrieves all available symbols declared across a repository's files.
   */
  async getAvailableSymbols(
    repositoryId: string = "sample-project"
  ): Promise<{ file: string; symbol: string; label: string }[]> {
    const store = getStore();
    const repoFiles = store.repositoryFiles?.[repositoryId] || {};
    const symbolsList: { file: string; symbol: string; label: string }[] = [];

    for (const [filePath, fileData] of Object.entries(repoFiles)) {
      if (!fileData || !fileData.code) continue;
      const lines = fileData.code.split(/\r?\n/);

      lines.forEach((line) => {
        const fnMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_]+)/);
        if (fnMatch) {
          symbolsList.push({
            file: filePath,
            symbol: fnMatch[1],
            label: `${filePath} → ${fnMatch[1]}()`,
          });
        }

        const constFnMatch = line.match(/(?:export\s+)?const\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\(/);
        if (constFnMatch) {
          symbolsList.push({
            file: filePath,
            symbol: constFnMatch[1],
            label: `${filePath} → ${constFnMatch[1]}()`,
          });
        }

        const classMatch = line.match(/(?:export\s+)?class\s+([a-zA-Z0-9_]+)/);
        if (classMatch) {
          symbolsList.push({
            file: filePath,
            symbol: classMatch[1],
            label: `${filePath} → class ${classMatch[1]}`,
          });
        }
      });
    }

    if (symbolsList.length > 0) {
      return symbolsList;
    }

    // Default seed symbols if empty
    return [
      {
        file: "src/services/auth.ts",
        symbol: "loginUser",
        label: "src/services/auth.ts → loginUser()",
      },
      {
        file: "src/components/LoginForm.tsx",
        symbol: "handleSubmit",
        label: "src/components/LoginForm.tsx → handleSubmit()",
      },
      {
        file: "src/utils/validation.ts",
        symbol: "validateEmail",
        label: "src/utils/validation.ts → validateEmail()",
      },
    ];
  }

  parseDiff(diffText: string, repositoryId: string) {
    return parseDiffInput(diffText, repositoryId);
  }

  mapPrompt(prompt: string, repositoryId: string) {
    return mapNaturalLanguageChange(prompt, repositoryId);
  }

  streamAI(result: ChangeImpactResult, onChunk: (accumulated: string) => void) {
    return streamAIRiskReport(result, onChunk);
  }

  exportMarkdown(result: ChangeImpactResult) {
    return generateMarkdownReport(result);
  }
}

export const impactService = new ImpactService();
export const PRESET_IMPACT_DATA: Record<string, ChangeImpactResult> = {};
