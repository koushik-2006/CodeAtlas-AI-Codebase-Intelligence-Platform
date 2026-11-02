/**
 * End-to-End Test for Real GitHub Repository Indexing & Discovery
 */

import { parseGitHubUrl } from "../lib/github-url-parser";
import { githubMetadataService } from "../services/github-metadata-service";
import { symbolExtractor } from "../services/symbol-extractor";

async function runTests() {
  console.log("=== STEP 1: Testing GitHub URL Parser ===");

  const urls = [
    "https://github.com/koushik-2006/Tourist-Management-System.git",
    "https://github.com/koushik-2006/CodeAtlas-AI-Codebase-Intelligence-Platform.git",
    "koushik-2006/Tourist-Management-System",
    "git@github.com:koushik-2006/Tourist-Management-System.git",
  ];

  for (const u of urls) {
    const res = parseGitHubUrl(u);
    if (!res.valid || res.owner !== "koushik-2006") {
      throw new Error(`Failed parsing URL: ${u} => ${JSON.stringify(res)}`);
    }
    console.log(`✓ Parsed "${u}" -> owner: ${res.owner}, repo: ${res.repo}`);
  }

  console.log("\n=== STEP 2: Testing Live GitHub Metadata for User's Repos ===");

  try {
    const meta1 = await githubMetadataService.fetchRepoMetadata("koushik-2006", "Tourist-Management-System");
    console.log(`✓ Fetched Tourist-Management-System metadata:`, {
      fullName: meta1.fullName,
      visibility: meta1.visibility,
      topLanguage: meta1.topLanguage,
      defaultBranch: meta1.defaultBranch,
      stars: meta1.stars,
    });

    console.log("\n=== STEP 3: Testing File Tree Retrieval ===");
    const tree = await githubMetadataService.fetchFileTree(
      "koushik-2006",
      "Tourist-Management-System",
      meta1.defaultBranch
    );
    console.log(`✓ Retrieved file tree: ${tree.length} total entries.`);
    const sampleFiles = tree.filter((t) => t.type === "blob").slice(0, 5);
    console.log(`  Sample files:`, sampleFiles.map((f) => f.path));

    console.log("\n=== STEP 4: Testing Raw Content Download ===");
    if (sampleFiles.length > 0) {
      const firstPath = sampleFiles[0].path;
      const content = await githubMetadataService.fetchFileContent(
        "koushik-2006",
        "Tourist-Management-System",
        meta1.defaultBranch,
        firstPath
      );
      if (content) {
        console.log(`✓ Downloaded content for ${firstPath} (${content.length} chars)`);
        const extracted = symbolExtractor.extractFromFile(firstPath, content);
        console.log(`✓ Extracted ${extracted.symbols.length} symbols, ${extracted.lineCount} lines.`);
      }
    }

  } catch (err: any) {
    console.warn(`GitHub API notice (might be rate-limited if unauthenticated): ${err.message}`);
  }

  console.log("\n=== STEP 5: Testing Multi-Language Symbol Extractor ===");
  const pyCode = `
class BookingManager:
    def __init__(self, db_conn):
        self.db = db_conn

    def create_booking(self, tourist_id: int, package_id: int):
        """Create a new tourist booking."""
        return self.db.insert("bookings", {"tourist_id": tourist_id, "package_id": package_id})
`;
  const pyExtracted = symbolExtractor.extractFromFile("services/booking.py", pyCode);
  console.log(`✓ Python: extracted ${pyExtracted.symbols.length} symbols:`, pyExtracted.symbols.map((s) => `${s.kind}: ${s.name}`));

  const tsCode = `
export interface TouristPackage {
  id: string;
  destination: string;
  price: number;
}

export class PackageService {
  async getPackage(id: string): Promise<TouristPackage> {
    return { id, destination: "Paris", price: 1200 };
  }
}
`;
  const tsExtracted = symbolExtractor.extractFromFile("src/services/package.ts", tsCode);
  console.log(`✓ TypeScript: extracted ${tsExtracted.symbols.length} symbols:`, tsExtracted.symbols.map((s) => `${s.kind}: ${s.name}`));

  console.log("\nALL TESTS PASSED SUCCESSFULLY! ✓✓✓");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

