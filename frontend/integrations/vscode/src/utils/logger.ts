import * as vscode from "vscode";

class Logger {
  private channel: vscode.OutputChannel | null = null;

  public init(): void {
    if (!this.channel) {
      this.channel = vscode.window.createOutputChannel("CodeAtlas");
    }
  }

  public log(message: string, ...args: any[]): void {
    this.appendLine("INFO", message, ...args);
  }

  public warn(message: string, ...args: any[]): void {
    this.appendLine("WARN", message, ...args);
  }

  public error(message: string, error?: any): void {
    const errorDetails = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack}` : String(error || "");
    this.appendLine("ERROR", `${message} ${errorDetails}`.trim());
  }

  public show(): void {
    this.channel?.show(true);
  }

  public dispose(): void {
    this.channel?.dispose();
    this.channel = null;
  }

  private appendLine(level: string, message: string, ...args: any[]): void {
    if (!this.channel) {
      this.init();
    }

    const timestamp = new Date().toISOString();
    let text = message;
    if (args.length > 0) {
      text += " " + args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
    }

    // Redact tokens, passwords, and authorization headers
    const sanitized = this.redactSecrets(text);
    this.channel?.appendLine(`[${timestamp}] [${level}] ${sanitized}`);
  }

  private redactSecrets(content: string): string {
    return content
      .replace(/Bearer\s+[a-zA-Z0-9_\-\.]{15,}/gi, "Bearer [REDACTED_TOKEN]")
      .replace(/ca_(live|test)_[a-zA-Z0-9]{20,}/gi, "ca_$1_[REDACTED_KEY]")
      .replace(/([?&]token=)[^&\s]+/gi, "$1[REDACTED]")
      .replace(/(["']?password["']?\s*[:=]\s*["'])[^"']+["']/gi, '$1[REDACTED]"');
  }
}

export const logger = new Logger();
