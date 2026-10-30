"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSidebarHtml = getSidebarHtml;
function getSidebarHtml(webview, extensionUri) {
    const nonce = getNonce();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodeAtlas Intelligence</title>
  <style>
    :root {
      --brand-primary: #8b5cf6;
      --brand-teal: #06b6d4;
      --brand-bg: var(--vscode-editor-background);
      --brand-fg: var(--vscode-editor-foreground);
      --brand-border: var(--vscode-panel-border, #333333);
      --font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--brand-bg);
      color: var(--brand-fg);
      font-family: var(--font-family);
      font-size: 13px;
      line-height: 1.5;
      padding: 12px;
      overflow-x: hidden;
    }

    /* Header & Branding */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--brand-border);
      margin-bottom: 12px;
    }

    .header-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 14px;
      background: linear-gradient(135deg, #a78bfa, #22d3ee);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 6px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-connected {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .badge-disconnected {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .badge-stale {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 4px;
      background: var(--vscode-sideBar-background, rgba(255, 255, 255, 0.03));
      padding: 3px;
      border-radius: 6px;
      margin-bottom: 12px;
      overflow-x: auto;
    }

    .tab-btn {
      flex: 1;
      padding: 5px 8px;
      border: none;
      background: transparent;
      color: var(--vscode-foreground);
      opacity: 0.7;
      font-size: 11px;
      font-weight: 500;
      border-radius: 4px;
      cursor: pointer;
      text-align: center;
      white-space: nowrap;
      transition: all 0.15s ease;
    }

    .tab-btn:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.05);
    }

    .tab-btn.active {
      opacity: 1;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      font-weight: 600;
    }

    /* Views */
    .tab-pane {
      display: none;
    }

    .tab-pane.active {
      display: block;
    }

    /* Inputs & Buttons */
    .form-group {
      margin-bottom: 10px;
    }

    label {
      display: block;
      font-size: 11px;
      font-weight: 500;
      opacity: 0.8;
      margin-bottom: 4px;
    }

    input, textarea, select {
      width: 100%;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border, var(--brand-border));
      border-radius: 4px;
      padding: 7px 9px;
      font-size: 12px;
      font-family: inherit;
    }

    input:focus, textarea:focus, select:focus {
      outline: 1px solid var(--vscode-focusBorder);
      border-color: var(--vscode-focusBorder);
    }

    textarea {
      resize: vertical;
      min-height: 65px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      padding: 7px 12px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.15s ease;
    }

    .btn:hover {
      background: var(--vscode-button-hoverBackground);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: var(--vscode-button-secondaryBackground, #3a3d41);
      color: var(--vscode-button-secondaryForeground, #ffffff);
    }

    .btn-secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground, #45494e);
    }

    /* Cards & Results */
    .card {
      background: var(--vscode-editorWidget-background, rgba(255, 255, 255, 0.03));
      border: 1px solid var(--brand-border);
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 10px;
    }

    .card-title {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card-body {
      font-size: 12px;
      opacity: 0.9;
    }

    /* Citations */
    .citations-list {
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .citation-chip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 8px;
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: 4px;
      color: var(--vscode-editorLink-activeForeground, #a78bfa);
      font-family: monospace;
      font-size: 11px;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.15s ease;
    }

    .citation-chip:hover {
      background: rgba(139, 92, 246, 0.25);
    }

    /* Findings / Review Items */
    .finding-item {
      border-left: 3px solid #3b82f6;
      background: rgba(255, 255, 255, 0.02);
      padding: 8px 10px;
      margin-bottom: 8px;
      border-radius: 0 4px 4px 0;
    }

    .finding-critical {
      border-left-color: #ef4444;
    }

    .finding-warning {
      border-left-color: #f59e0b;
    }

    .finding-info {
      border-left-color: #06b6d4;
    }

    .finding-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .finding-title {
      font-weight: 600;
      font-size: 12px;
    }

    .finding-meta {
      font-size: 10px;
      opacity: 0.7;
      font-family: monospace;
      margin-bottom: 4px;
    }

    .finding-remediation {
      font-size: 11px;
      background: rgba(255, 255, 255, 0.04);
      padding: 4px 6px;
      border-radius: 4px;
      margin-top: 4px;
      border-left: 2px solid #10b981;
    }

    /* Code Snippet */
    pre code {
      display: block;
      background: var(--vscode-textCodeBlock-background, rgba(0, 0, 0, 0.2));
      padding: 6px;
      border-radius: 4px;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 11px;
      overflow-x: auto;
      margin-top: 4px;
    }

    /* Spinner */
    .spinner {
      display: none;
      text-align: center;
      padding: 16px;
      font-size: 12px;
      opacity: 0.8;
    }

    .spinner.active {
      display: block;
    }

    .context-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      padding: 4px 8px;
      background: rgba(255, 255, 255, 0.04);
      border-radius: 4px;
      margin-bottom: 10px;
      border: 1px dashed var(--brand-border);
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="header-brand">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
        <polyline points="2 17 12 22 22 17"></polyline>
        <polyline points="2 12 12 17 22 12"></polyline>
      </svg>
      <span>CodeAtlas</span>
    </div>
    <div id="connectionBadge" class="badge badge-disconnected">Disconnected</div>
  </div>

  <!-- Active Repo / Selection Info -->
  <div id="activeContextPill" class="context-pill">
    <span>Repo:</span>
    <strong id="activeRepoText">None</strong>
  </div>

  <!-- Navigation Tabs -->
  <div class="tabs">
    <button class="tab-btn active" data-tab="qa">Q&A</button>
    <button class="tab-btn" data-tab="explain">Explain</button>
    <button class="tab-btn" data-tab="review">Review</button>
    <button class="tab-btn" data-tab="impact">Impact</button>
    <button class="tab-btn" data-tab="debug">Debug</button>
    <button class="tab-btn" data-tab="status">Setup</button>
  </div>

  <!-- Loading State -->
  <div id="spinner" class="spinner">
    <div id="spinnerText">Processing with CodeAtlas...</div>
  </div>

  <!-- TAB 1: Q&A -->
  <div id="pane-qa" class="tab-pane active">
    <div class="form-group">
      <label for="qaInput">Ask about this codebase:</label>
      <textarea id="qaInput" placeholder="e.g. Where is authentication handled? What calls rotateRefreshToken?"></textarea>
    </div>
    <div class="form-group">
      <button id="qaSubmitBtn" class="btn">Ask CodeAtlas</button>
    </div>
    <div id="qaResults"></div>
  </div>

  <!-- TAB 2: Explain Selected Code -->
  <div id="pane-explain" class="tab-pane">
    <div class="form-group">
      <button id="explainBtn" class="btn">Explain Active Selection</button>
    </div>
    <div id="explainResults">
      <div style="font-size: 11px; opacity: 0.6; text-align: center; padding: 20px 0;">
        Select code in the active editor and click "Explain Active Selection".
      </div>
    </div>
  </div>

  <!-- TAB 3: Code Review -->
  <div id="pane-review" class="tab-pane">
    <div class="form-group">
      <button id="reviewBtn" class="btn">Review Active Code</button>
    </div>
    <div id="reviewResults">
      <div style="font-size: 11px; opacity: 0.6; text-align: center; padding: 20px 0;">
        Run a code review to find security flaws, edge case bugs, and contract issues.
      </div>
    </div>
  </div>

  <!-- TAB 4: Impact Analysis -->
  <div id="pane-impact" class="tab-pane">
    <div class="form-group">
      <button id="impactBtn" class="btn">Analyze Change Impact</button>
    </div>
    <div id="impactResults">
      <div style="font-size: 11px; opacity: 0.6; text-align: center; padding: 20px 0;">
        Assess how local changes affect callers, services, and test suites.
      </div>
    </div>
  </div>

  <!-- TAB 5: Debug & Stack Trace -->
  <div id="pane-debug" class="tab-pane">
    <div class="form-group">
      <label for="debugTraceInput">Paste Stack Trace:</label>
      <textarea id="debugTraceInput" placeholder="Paste error stack trace here (e.g. Error: Cannot read properties of null at loginUser auth.ts:42)"></textarea>
    </div>
    <div class="form-group">
      <button id="debugSubmitBtn" class="btn">Analyze Stack Trace</button>
    </div>
    <div id="debugResults"></div>
  </div>

  <!-- TAB 6: Connection & Settings -->
  <div id="pane-status" class="tab-pane">
    <div class="card">
      <div class="card-title">Connection Settings</div>
      <div class="form-group">
        <label for="serverUrlInput">Server URL:</label>
        <input type="text" id="serverUrlInput" value="http://localhost:3000" />
      </div>
      <div class="form-group">
        <label for="apiTokenInput">API Access Token:</label>
        <input type="password" id="apiTokenInput" placeholder="ca_live_... (optional)" />
      </div>
      <div class="form-group" style="display: flex; gap: 6px;">
        <button id="connectBtn" class="btn" style="flex: 2;">Connect</button>
        <button id="disconnectBtn" class="btn btn-secondary" style="flex: 1;">Disconnect</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Active Repository</div>
      <div class="form-group">
        <select id="repoSelect">
          <option value="">No repository connected</option>
        </select>
      </div>
      <button id="refreshContextBtn" class="btn btn-secondary">Refresh Repositories</button>
    </div>

    <div class="card">
      <button id="openWebDashboardBtn" class="btn btn-secondary">Open CodeAtlas Web App</button>
    </div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const target = document.getElementById('pane-' + btn.dataset.tab);
        if (target) target.classList.add('active');
      });
    });

    // Form inputs and buttons
    const connectionBadge = document.getElementById('connectionBadge');
    const activeRepoText = document.getElementById('activeRepoText');
    const repoSelect = document.getElementById('repoSelect');
    const spinner = document.getElementById('spinner');
    const spinnerText = document.getElementById('spinnerText');

    // Setup action triggers
    document.getElementById('connectBtn').addEventListener('click', () => {
      const serverUrl = document.getElementById('serverUrlInput').value;
      const token = document.getElementById('apiTokenInput').value;
      vscode.postMessage({ type: 'connect', serverUrl, token });
    });

    document.getElementById('disconnectBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'disconnect' });
    });

    repoSelect.addEventListener('change', () => {
      vscode.postMessage({ type: 'selectRepository', repositoryId: repoSelect.value });
    });

    document.getElementById('refreshContextBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'refreshState' });
    });

    document.getElementById('openWebDashboardBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'openDashboard' });
    });

    // Q&A trigger
    document.getElementById('qaSubmitBtn').addEventListener('click', () => {
      const question = document.getElementById('qaInput').value;
      if (!question || !question.trim()) return;
      vscode.postMessage({ type: 'askQuestion', question });
    });

    // Explain trigger
    document.getElementById('explainBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'explainCode' });
    });

    // Review trigger
    document.getElementById('reviewBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'reviewCode' });
    });

    // Impact trigger
    document.getElementById('impactBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'analyzeImpact' });
    });

    // Debug trigger
    document.getElementById('debugSubmitBtn').addEventListener('click', () => {
      const stackTrace = document.getElementById('debugTraceInput').value;
      vscode.postMessage({ type: 'analyzeStackTrace', stackTrace });
    });

    // Window message listener
    window.addEventListener('message', event => {
      const msg = event.data;

      if (msg.type === 'setLoading') {
        if (msg.loading) {
          spinner.classList.add('active');
          spinnerText.textContent = msg.message || 'Processing with CodeAtlas...';
        } else {
          spinner.classList.remove('active');
        }
      }

      if (msg.type === 'setConnectionState') {
        const state = msg.state;
        if (state.isConnected) {
          connectionBadge.textContent = 'Connected';
          connectionBadge.className = 'badge badge-connected';
          activeRepoText.textContent = state.selectedRepositoryId || 'None selected';
        } else {
          connectionBadge.textContent = state.lastError ? 'Error' : 'Disconnected';
          connectionBadge.className = 'badge badge-disconnected';
          activeRepoText.textContent = 'Disconnected';
        }

        // Populate repo dropdown
        repoSelect.innerHTML = '';
        if (state.repositories.length === 0) {
          repoSelect.innerHTML = '<option value="">No repositories available</option>';
        } else {
          state.repositories.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r.id;
            opt.textContent = r.name + ' (' + r.language + ')';
            if (r.id === state.selectedRepositoryId) opt.selected = true;
            repoSelect.appendChild(opt);
          });
        }
      }

      if (msg.type === 'showResult') {
        const cat = msg.category;
        const data = msg.data;

        if (cat === 'qa') {
          renderQAResult(data);
          switchTab('qa');
        } else if (cat === 'explain') {
          renderExplainResult(data);
          switchTab('explain');
        } else if (cat === 'review') {
          renderReviewResult(data);
          switchTab('review');
        } else if (cat === 'impact') {
          renderImpactResult(data);
          switchTab('impact');
        } else if (cat === 'debug') {
          renderDebugResult(data);
          switchTab('debug');
        }
      }
    });

    function switchTab(tabId) {
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tabId);
      });
      document.querySelectorAll('.tab-pane').forEach(p => {
        p.classList.toggle('active', p.id === 'pane-' + tabId);
      });
    }

    function renderQAResult(data) {
      const el = document.getElementById('qaResults');
      let html = '<div class="card"><div class="card-title">Answer</div><div class="card-body">' + escapeHtml(data.answer) + '</div>';

      if (data.confirmedFacts && data.confirmedFacts.length > 0) {
        html += '<div style="margin-top: 8px; font-size: 11px;"><strong>Verified Facts:</strong><ul style="padding-left: 16px;">';
        data.confirmedFacts.forEach(f => { html += '<li>' + escapeHtml(f) + '</li>'; });
        html += '</ul></div>';
      }

      if (data.sources && data.sources.length > 0) {
        html += '<div style="margin-top: 8px; font-size: 11px;"><strong>Source Citations:</strong><div class="citations-list">';
        data.sources.forEach(s => {
          html += '<div class="citation-chip" onclick="openSource(\\'' + s.file + '\\', ' + s.line + ', ' + (s.endLine || s.line) + ')">' +
            '<span>' + escapeHtml(s.file) + ':' + s.line + '</span>' +
            '<span style="opacity: 0.7;">' + escapeHtml(s.snippet || 'view') + '</span></div>';
        });
        html += '</div></div>';
      }

      html += '</div>';
      el.innerHTML = html;
    }

    function renderExplainResult(data) {
      const el = document.getElementById('explainResults');
      let html = '<div class="card"><div class="card-title">Purpose</div><div class="card-body">' + escapeHtml(data.purpose || data.summary) + '</div></div>';

      if (data.howItWorks && data.howItWorks.length > 0) {
        html += '<div class="card"><div class="card-title">Step-by-Step Breakdown</div><div class="card-body">';
        data.howItWorks.slice(0, 8).forEach(s => {
          html += '<div style="margin-bottom: 4px; font-size: 11px;"><code>L' + s.line + '</code>: ' + escapeHtml(s.explanation) + '</div>';
        });
        html += '</div></div>';
      }

      if (data.inputsAndOutputs) {
        html += '<div class="card"><div class="card-title">Inputs & Outputs</div><div class="card-body" style="font-size: 11px;">' +
          '<div><strong>Params:</strong> ' + escapeHtml(data.inputsAndOutputs.parameters.join(', ') || 'none') + '</div>' +
          '<div><strong>Return:</strong> <code>' + escapeHtml(data.inputsAndOutputs.returnType) + '</code></div>' +
          '</div></div>';
      }

      if (data.sourceCitations && data.sourceCitations.length > 0) {
        html += '<div class="card"><div class="card-title">References</div><div class="citations-list">';
        data.sourceCitations.forEach(s => {
          html += '<div class="citation-chip" onclick="openSource(\\'' + s.file + '\\', ' + s.line + ', ' + (s.endLine || s.line) + ')">' +
            '<span>' + escapeHtml(s.file) + ':' + s.line + '</span>' +
            '<span style="opacity: 0.7;">' + escapeHtml(s.snippet || 'view') + '</span></div>';
        });
        html += '</div></div>';
      }

      el.innerHTML = html;
    }

    function renderReviewResult(data) {
      const el = document.getElementById('reviewResults');
      let html = '<div class="card"><div class="card-title">Review Summary</div><div class="card-body">' + escapeHtml(data.summary) + '</div></div>';

      if (data.findings && data.findings.length > 0) {
        data.findings.forEach(f => {
          html += '<div class="finding-item finding-' + f.severity + '">' +
            '<div class="finding-header">' +
              '<span class="finding-title">' + escapeHtml(f.title) + '</span>' +
              '<span class="badge">' + f.severity + '</span>' +
            '</div>' +
            '<div class="finding-meta" onclick="openSource(\\'' + f.file + '\\', ' + f.line + ')" style="cursor: pointer; text-decoration: underline;">' +
              escapeHtml(f.file) + ':' + f.line +
            '</div>' +
            '<div style="font-size: 11px; margin-bottom: 4px;">' + escapeHtml(f.description) + '</div>' +
            '<div class="finding-remediation"><strong>Fix:</strong> ' + escapeHtml(f.suggestedRemediation) + '</div>' +
          '</div>';
        });
      }

      el.innerHTML = html;
    }

    function renderImpactResult(data) {
      const el = document.getElementById('impactResults');
      let html = '<div class="card"><div class="card-title">Impact Rating: ' + (data.severity || 'low').toUpperCase() + ' (Score ' + data.impactScore + '/100)</div>' +
        '<div class="card-body">' + escapeHtml(data.explanation) + '</div></div>';

      if (data.affectedComponents && data.affectedComponents.length > 0) {
        html += '<div class="card"><div class="card-title">Affected Dependents (' + data.affectedComponents.length + ')</div><div class="citations-list">';
        data.affectedComponents.forEach(c => {
          html += '<div class="citation-chip" onclick="openSource(\\'' + c.file + '\\', ' + (c.line || 1) + ')">' +
            '<span>' + escapeHtml(c.name) + ' (' + c.type + ')</span>' +
            '<span style="opacity: 0.7;">' + escapeHtml(c.file) + '</span></div>';
        });
        html += '</div></div>';
      }

      if (data.recommendedTests && data.recommendedTests.length > 0) {
        html += '<div class="card"><div class="card-title">Recommended Regression Tests</div><div class="citations-list">';
        data.recommendedTests.forEach(t => {
          html += '<div class="citation-chip" onclick="openSource(\\'' + t.file + '\\', ' + (t.line || 1) + ')">' +
            '<span>' + escapeHtml(t.name) + '</span>' +
            '<span style="opacity: 0.7;">' + escapeHtml(t.file) + '</span></div>';
        });
        html += '</div></div>';
      }

      el.innerHTML = html;
    }

    function renderDebugResult(data) {
      const el = document.getElementById('debugResults');
      let html = '<div class="card"><div class="card-title">' + escapeHtml(data.errorType) + ': ' + escapeHtml(data.errorMessage) + '</div>' +
        '<div class="card-body"><strong>Hypothesis:</strong> ' + escapeHtml(data.rootCauseHypothesis) + '</div>' +
        '<div style="margin-top: 6px; font-size: 11px; color: #10b981;"><strong>Recommended Fix:</strong> ' + escapeHtml(data.suggestedFix) + '</div></div>';

      if (data.frames && data.frames.length > 0) {
        html += '<div class="card"><div class="card-title">Trace Frames (' + data.frames.length + ')</div><div class="citations-list">';
        data.frames.forEach(f => {
          html += '<div class="citation-chip" onclick="openSource(\\'' + f.file + '\\', ' + f.line + ')">' +
            '<span>' + escapeHtml(f.method || 'anonymous') + '</span>' +
            '<span style="opacity: 0.7;">' + escapeHtml(f.file) + ':' + f.line + '</span></div>';
        });
        html += '</div></div>';
      }

      el.innerHTML = html;
    }

    window.openSource = function(file, line, endLine) {
      vscode.postMessage({ type: 'openFile', file, line, endLine });
    };

    function escapeHtml(text) {
      if (!text) return '';
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  </script>
</body>
</html>`;
}
function getNonce() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=sidebar-html.js.map