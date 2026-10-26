"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const vscode = __importStar(require("vscode"));
class Logger {
    channel = null;
    init() {
        if (!this.channel) {
            this.channel = vscode.window.createOutputChannel("CodeAtlas");
        }
    }
    log(message, ...args) {
        this.appendLine("INFO", message, ...args);
    }
    warn(message, ...args) {
        this.appendLine("WARN", message, ...args);
    }
    error(message, error) {
        const errorDetails = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack}` : String(error || "");
        this.appendLine("ERROR", `${message} ${errorDetails}`.trim());
    }
    show() {
        this.channel?.show(true);
    }
    dispose() {
        this.channel?.dispose();
        this.channel = null;
    }
    appendLine(level, message, ...args) {
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
    redactSecrets(content) {
        return content
            .replace(/Bearer\s+[a-zA-Z0-9_\-\.]{15,}/gi, "Bearer [REDACTED_TOKEN]")
            .replace(/ca_(live|test)_[a-zA-Z0-9]{20,}/gi, "ca_$1_[REDACTED_KEY]")
            .replace(/([?&]token=)[^&\s]+/gi, "$1[REDACTED]")
            .replace(/(["']?password["']?\s*[:=]\s*["'])[^"']+["']/gi, '$1[REDACTED]"');
    }
}
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map