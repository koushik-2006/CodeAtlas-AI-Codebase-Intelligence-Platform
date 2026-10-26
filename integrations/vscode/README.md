# CodeAtlas Visual Studio Code Extension

Brings CodeAtlas AI Codebase Intelligence directly into the developer's editor.

Understand unfamiliar source code, explain functions and classes, ask grounded codebase questions with exact citations, trace dependencies, inspect change impact, review code with inline diagnostics, and navigate stack traces without leaving Visual Studio Code.

---

## Features

- **Explain Selected Code**: Instant line-by-line breakdown, algorithmic summary, inputs/outputs, edge cases, potential bugs, and referenced symbols for any selected function or block.
- **Codebase Q&A (RAG)**: Conversational assistant answering architecture, implementation, and cross-codebase questions with verified 4-part citations (`repo:file:line`).
- **In-Editor Code Review & Diagnostics**: Identifies security vulnerabilities, logic bugs, contract inconsistencies, and unhandled promise rejections, publishing them as VS Code diagnostics with lightbulb Quick Fixes.
- **Change Impact Analysis**: Evaluates how modifying a file or symbol ripples downstream to callers, services, and regression test suites.
- **Stack Trace Debugging**: Parses pasted runtime stack traces, maps frames to workspace source files, and explains probable root causes and remediation steps.
- **Symbol & Call Graph Intelligence**: Resolves definitions, callers, callees, references, and tests with one-click editor navigation.
- **Multi-Repository Context**: Switch between authorized repositories or query across multi-codebase workspaces (Phase 17).
- **Secure Secret Storage**: Access tokens are stored exclusively in VS Code's encrypted `SecretStorage`, never written to workspace settings or disk files.

---

## Installation & Development Setup

### Prerequisites

- **VS Code**: Version `1.85.0` or higher
- **Node.js**: Version `18.0.0` or higher
- **CodeAtlas Platform**: Running instance of CodeAtlas (e.g. `http://localhost:3000` or `http://localhost:3001`)

### Running Locally from Source

1. Clone or open the CodeAtlas workspace in VS Code.
2. Build the extension:
   ```bash
   npm run build:vscode
   ```
3. Press **F5** (or navigate to **Run and Debug** -> **Run CodeAtlas Extension (F5)**).
4. An **Extension Development Host** window will open with the CodeAtlas extension loaded.
5. Look for the **CodeAtlas** icon in the Activity Bar (left sidebar) or status bar indicator at the bottom right.

---

## Connecting to CodeAtlas

1. Click the **CodeAtlas** icon in the Activity Bar to open the sidebar.
2. In the **Setup** tab (or via Command Palette `Ctrl+Shift+P` -> `CodeAtlas: Connect to Server`):
   - **Server URL**: `http://localhost:3000` (or your deployment URL)
   - **API Token**: Optional access token (e.g., `ca_live_...`). If left blank, defaults to local session.
3. Click **Connect**.
4. Once connected, your authorized repositories will appear in the repository selector dropdown, and the status bar will show `$(compass) CodeAtlas: Connected (<repo>)`.

---

## Available Commands

| Command Identifier | Command Palette Title | Description | Context Menu |
| :--- | :--- | :--- | :--- |
| `codeatlas.connect` | `CodeAtlas: Connect to Server` | Configure server URL and token | No |
| `codeatlas.disconnect` | `CodeAtlas: Disconnect` | Clear credentials and disconnect | No |
| `codeatlas.selectRepository` | `CodeAtlas: Select Active Repository` | Switch the active codebase context | No |
| `codeatlas.explainSelectedCode` | `CodeAtlas: Explain Selected Code` | Explains the selected code block | Yes (`editorHasSelection`) |
| `codeatlas.askAboutCodebase` | `CodeAtlas: Ask About This Codebase` | Ask questions with grounded source citations | No |
| `codeatlas.findRelatedImplementations` | `CodeAtlas: Find Related Implementations` | Finds implementations, callers, and duplicates | Yes (`editorHasSelection`) |
| `codeatlas.explainDependencies` | `CodeAtlas: Explain Dependencies` | Traces package and service relationships | No |
| `codeatlas.analyzeChangeImpact` | `CodeAtlas: Analyze Change Impact` | Analyzes change ripple effects | Yes (always) |
| `codeatlas.reviewSelectedCode` | `CodeAtlas: Review Selected Code` | Reviews code and generates diagnostics | Yes (`editorHasSelection`) |
| `codeatlas.analyzeStackTrace` | `CodeAtlas: Analyze Stack Trace` | Parses and maps stack traces | Yes (`editorHasSelection`) |
| `codeatlas.openDashboard` | `CodeAtlas: Open CodeAtlas Dashboard` | Opens the CodeAtlas web dashboard | No |
| `codeatlas.refreshRepositoryContext` | `CodeAtlas: Refresh Repository Context` | Refreshes repository metadata | No |

---

## Configuration Settings

Settings can be customized in `.vscode/settings.json` or through the VS Code Settings UI under **Extensions -> CodeAtlas**:

```json
{
  "codeatlas.serverUrl": "http://localhost:3000",
  "codeatlas.selectedRepositoryId": "sample-project",
  "codeatlas.autoDetectRepository": true,
  "codeatlas.enableDiagnostics": true,
  "codeatlas.requestTimeoutMs": 15000
}
```

---

## Security & Privacy Architecture

- **Path Traversal Protection**: All file paths returned by server citations or requested by navigation commands are strictly validated (`isSafeRelativePath`). Paths with `..`, null bytes, or outside active workspace roots are blocked.
- **Zero Local Code Exfiltration**: Code is only sent to CodeAtlas when the developer explicitly triggers an action (such as *Explain*, *Review*, or *Q&A*). No background telemetry captures source code.
- **Secret Storage**: Tokens are stored via VS Code's `vscode.SecretStorage` API (OS keychain / encrypted credential vault).
- **Secret Redaction**: The extension logger and stack trace parser automatically redact API keys, tokens, and Authorization headers.
- **Server-Side Enforcement**: All queries are independently validated on the server against tenant repository access controls.

---

## Testing & Verification

Run the automated test suite covering extension activation, command registration, API client, path safety, diagnostics, and backend endpoints:

```bash
# Run Phase 18 test suite
npm run test:phase18

# Compile extension
npm run build:vscode
```

---

## Packaging

To package the extension into a `.vsix` file for offline distribution:

```bash
cd integrations/vscode
npx @vscode/vsce package
```

*(Note: Requires `@vscode/vsce` installed. Packaging verified for VSIX manifest compatibility).*

---

## Limitations

- **Unsaved Buffer Impact**: Change impact analysis evaluates against the currently indexed git revision; unsaved buffer modifications are highlighted with a disclaimer.
- **External Git Remotes**: Real-time webhook synchronizations require network reachability to the CodeAtlas server instance.
