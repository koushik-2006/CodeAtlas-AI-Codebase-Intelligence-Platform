import { db } from "./db";
import {
  ChangeImpactResult,
  ImpactAnalysisRequest,
  ImpactSeverity,
  EndpointImpact,
  ComponentImpact,
  ServiceImpact,
  TestToRerun,
  AffectedComponent,
} from "@/types/impact";
import { DbCodeSymbol, DbCodeRelationship, DbRepositoryFile } from "@/types/database";

/**
 * Server-side Change Impact Intelligence Engine.
 * Analyzes repository call graphs, dependency trees, and test suites
 * to determine breaking risks and ripple effects for a modified file or symbol.
 */
export class ImpactEngine {
  /**
   * Analyzes the potential ripple effect of changing a given file or symbol in a repository.
   */
  analyzeImpact(request: ImpactAnalysisRequest): ChangeImpactResult {
    const { repositoryId = "sample-project", file, symbol, options } = request;

    const symbols = db.getCodeSymbols(repositoryId);
    const relationships = db.getCodeRelationships(repositoryId);
    const files = db.getRepositoryFiles(repositoryId);

    // 1. Locate the target symbol or file
    const targetSymbol = this.findTargetSymbol(symbols, file, symbol);

    if (!targetSymbol) {
      // Graceful fallback when symbol is not explicitly in index
      return {
        symbol: symbol || "Unknown symbol",
        file: file || "Unknown file",
        riskLevel: "Low",
        riskScore: 15,
        affectedEndpoints: [],
        affectedComponents: [],
        affectedServices: [],
        testsToRerun: [],
        directlyDependent: [],
        downstreamAffected: [],
        reviewRequired: [],
        recommendation: `The symbol '${symbol}' could not be matched to an indexed declaration in ${file}. Static impact analysis found no registered callers.`,
        limitationsNote:
          "Target was not identified as a top-level AST function, class, or endpoint. Verify that the file and symbol name match the repository index.",
        isSimulated: false,
      };
    }

    // 2. Traverse Graph: Upstream Callers (Direct Dependents)
    const directCallerEdges = relationships.filter(
      (rel) => rel.toSymbolId === targetSymbol.id || rel.toSymbolName === targetSymbol.name
    );

    const directlyDependent: AffectedComponent[] = [];
    const affectedComponents: ComponentImpact[] = [];
    const testsToRerun: TestToRerun[] = [];
    const affectedEndpoints: EndpointImpact[] = [];

    directCallerEdges.forEach((rel, idx) => {
      const callerSym = symbols.find((s) => s.id === rel.fromSymbolId || s.name === rel.fromSymbolName);
      const isTest = rel.type === "tests" || callerSym?.type === "test";

      if (isTest) {
        testsToRerun.push({
          name: rel.fromSymbolName,
          file: callerSym?.filePath || "tests",
          line: callerSym?.startLine || 1,
          status: "needs-update",
        });
        directlyDependent.push({
          id: `dep_test_${idx}`,
          name: rel.fromSymbolName,
          type: "test",
          file: callerSym?.filePath || "tests",
          line: callerSym?.startLine || 1,
          reason: `Assents behavior or contracts of ${targetSymbol.name}`,
          severity: "High",
          relationship: "Test Suite",
        });
      } else {
        directlyDependent.push({
          id: `dep_caller_${idx}`,
          name: rel.fromSymbolName,
          type: callerSym?.type === "endpoint" ? "endpoint" : "component",
          file: callerSym?.filePath || file,
          line: callerSym?.startLine || 1,
          reason: `Directly calls ${targetSymbol.name} in implementation`,
          severity: "High",
          relationship: "Direct Caller",
        });

        affectedComponents.push({
          name: rel.fromSymbolName,
          file: callerSym?.filePath || file,
          callerLine: callerSym?.startLine || 1,
        });

        if (callerSym?.type === "endpoint") {
          affectedEndpoints.push({
            method: callerSym.name.split(" ")[0] || "POST",
            path: callerSym.name.split(" ")[1] || "/api",
            file: callerSym.filePath,
            line: callerSym.startLine,
          });
        }
      }
    });

    // 3. Traverse Graph: Downstream Callees (Dependencies)
    const downstreamAffected: AffectedComponent[] = [];
    const affectedServices: ServiceImpact[] = [];

    const downstreamEdges = relationships.filter(
      (rel) => rel.fromSymbolId === targetSymbol.id || rel.fromSymbolName === targetSymbol.name
    );

    downstreamEdges.forEach((rel, idx) => {
      const calleeSym = symbols.find((s) => s.id === rel.toSymbolId || s.name === rel.toSymbolName);
      const isService = calleeSym?.type === "service";
      const isDb = calleeSym?.type === "table";

      downstreamAffected.push({
        id: `down_${idx}`,
        name: rel.toSymbolName,
        type: isService ? "service" : isDb ? "database" : "component",
        file: calleeSym?.filePath || file,
        line: calleeSym?.startLine || 1,
        reason: `Invoked or accessed by ${targetSymbol.name} execution`,
        severity: "Medium",
        relationship: isService ? "Downstream Service" : isDb ? "Persistence Store" : "Callee",
      });

      if (isService) {
        affectedServices.push({
          name: rel.toSymbolName,
          file: calleeSym?.filePath || file,
          line: calleeSym?.startLine,
        });
      }
    });

    // 4. Multi-hop (2-Hop) Traversal for Endpoints
    // Check if any direct caller is called by an API endpoint
    directlyDependent.forEach((dep) => {
      const secondHopEdges = relationships.filter((rel) => rel.toSymbolName === dep.name);
      secondHopEdges.forEach((edge) => {
        const grandCaller = symbols.find((s) => s.id === edge.fromSymbolId || s.name === edge.fromSymbolName);
        if (grandCaller?.type === "endpoint") {
          const endpointPath = grandCaller.name.split(" ")[1] || "/api";
          if (!affectedEndpoints.some((ep) => ep.path === endpointPath)) {
            affectedEndpoints.push({
              method: grandCaller.name.split(" ")[0] || "POST",
              path: endpointPath,
              file: grandCaller.filePath,
              line: grandCaller.startLine,
            });
          }
        }
      });
    });

    // 5. Compute Explainable Risk Score & Severity
    // Formula: (Callers * 20) + (Endpoints * 25) + (Missing tests * 15) bounded to [10, 95]
    const callerWeight = directlyDependent.filter((d) => d.type !== "test").length * 20;
    const endpointWeight = affectedEndpoints.length * 25;
    const testPenalty = testsToRerun.length === 0 ? 20 : 0;
    const downstreamWeight = downstreamAffected.length * 10;

    const rawScore = 15 + callerWeight + endpointWeight + testPenalty + downstreamWeight;
    const riskScore = Math.min(Math.max(rawScore, 15), 92);

    let riskLevel: ImpactSeverity = "Low";
    if (riskScore >= 70) riskLevel = "High";
    else if (riskScore >= 40) riskLevel = "Medium";

    // 6. Transparent Recommendations & Disclosures
    let recommendation = "";
    if (riskLevel === "High") {
      recommendation = `Modifying '${targetSymbol.name}' presents high breaking potential. It impacts ${affectedComponents.length} direct caller(s), ${affectedEndpoints.length} API endpoint(s), and invalidates ${testsToRerun.length} unit test(s). Verify parameter compatibility before committing.`;
    } else if (riskLevel === "Medium") {
      recommendation = `Modifying '${targetSymbol.name}' affects localized callers and downstream services. Ensure return type contracts match consumer expectations.`;
    } else {
      recommendation = `Low risk modification. No high-traffic endpoints or external consumers depend directly on '${targetSymbol.name}'.`;
    }

    const reviewRequired: AffectedComponent[] = [];
    if (files.some((f) => f.path.endsWith("package.json"))) {
      reviewRequired.push({
        id: "rev_pkg",
        name: "Dependencies",
        type: "external",
        file: "package.json",
        reason: "Review external library and runtime typing compatibility",
        severity: "Low",
        relationship: "External Dependency",
      });
    }

    return {
      symbol: `${targetSymbol.name}(...)`,
      file: `${targetSymbol.filePath}:${targetSymbol.startLine}-${targetSymbol.endLine}`,
      riskLevel,
      riskScore,
      affectedEndpoints,
      affectedComponents,
      affectedServices,
      testsToRerun,
      directlyDependent,
      downstreamAffected,
      reviewRequired,
      recommendation,
      limitationsNote:
        "Analysis based on static AST call hierarchy and test assertions. Dynamic reflective dispatches or unindexed consumers are outside static scope. Never assume any codebase change is 100% risk-free.",
      isSimulated: false,
    };
  }

  private findTargetSymbol(
    symbols: DbCodeSymbol[],
    file?: string,
    symbolName?: string
  ): DbCodeSymbol | null {
    if (!symbolName && !file) return null;

    const cleanSymbol = (symbolName || "").replace(/\(.*?\)/, "").trim();

    // 1. Exact match on filePath and symbol name
    if (file && cleanSymbol) {
      const match = symbols.find(
        (s) => s.filePath === file && s.name.toLowerCase() === cleanSymbol.toLowerCase()
      );
      if (match) return match;
    }

    // 2. Match symbol name across any file
    if (cleanSymbol) {
      const match = symbols.find((s) => s.name.toLowerCase() === cleanSymbol.toLowerCase());
      if (match) return match;
    }

    // 3. Fallback to first symbol in the specified file
    if (file) {
      const fileMatch = symbols.find((s) => s.filePath === file);
      if (fileMatch) return fileMatch;
    }

    return null;
  }
}

export const impactEngine = new ImpactEngine();
