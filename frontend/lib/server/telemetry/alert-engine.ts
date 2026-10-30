import {
  OperationalAlertRule,
  OperationalAlertIncident,
  AlertSeverity,
  AlertStatus,
} from "@/types/observability";
import { logger } from "./logger";

export const DEFAULT_ALERT_RULES: OperationalAlertRule[] = [
  {
    id: "rule_high_error_rate",
    name: "High API Error Rate",
    metric: "api_error_rate",
    condition: "gt",
    threshold: 5,
    unit: "%",
    severity: "critical",
    cooldownSeconds: 60,
    description: "API 4xx/5xx error rate exceeds 5% of total requests",
  },
  {
    id: "rule_high_p95_latency",
    name: "Elevated P95 Request Latency",
    metric: "api_p95_latency",
    condition: "gt",
    threshold: 1500,
    unit: "ms",
    severity: "warning",
    cooldownSeconds: 60,
    description: "API 95th percentile request latency exceeds 1500ms SLA",
  },
  {
    id: "rule_ai_provider_failure",
    name: "AI Provider Degradation",
    metric: "ai_failure_rate",
    condition: "gt",
    threshold: 10,
    unit: "%",
    severity: "critical",
    cooldownSeconds: 60,
    description: "AI generation and inference failure rate exceeds 10%",
  },
  {
    id: "rule_indexing_queue_backlog",
    name: "Indexing Job Queue Backlog",
    metric: "indexing_queue_depth",
    condition: "gt",
    threshold: 5,
    unit: "jobs",
    severity: "warning",
    cooldownSeconds: 60,
    description: "Repository indexing active locks and concurrency backlog exceed 5",
  },
  {
    id: "rule_storage_latency",
    name: "Elevated Storage Latency",
    metric: "db_latency",
    condition: "gt",
    threshold: 50,
    unit: "ms",
    severity: "warning",
    cooldownSeconds: 60,
    description: "Database and file storage read/write latency exceeds 50ms",
  },
  {
    id: "rule_circuit_breaker_open",
    name: "External Service Circuit Tripped",
    metric: "circuit_breaker_open_count",
    condition: "gt",
    threshold: 0,
    unit: "breakers",
    severity: "critical",
    cooldownSeconds: 30,
    description: "One or more external service circuit breakers are in OPEN state fast-failing traffic",
  },
];

export class AlertEngine {
  private rules: Map<string, OperationalAlertRule> = new Map();
  private incidents: OperationalAlertIncident[] = [];
  private maxStoredIncidents = 100;

  constructor(rules: OperationalAlertRule[] = DEFAULT_ALERT_RULES) {
    rules.forEach((rule) => this.rules.set(rule.id, rule));
  }

  getRules(): OperationalAlertRule[] {
    return Array.from(this.rules.values());
  }

  addRule(rule: OperationalAlertRule): void {
    this.rules.set(rule.id, rule);
  }

  private testCondition(
    condition: "gt" | "lt" | "eq" | "gte" | "lte",
    currentValue: number,
    threshold: number
  ): boolean {
    switch (condition) {
      case "gt":
        return currentValue > threshold;
      case "gte":
        return currentValue >= threshold;
      case "lt":
        return currentValue < threshold;
      case "lte":
        return currentValue <= threshold;
      case "eq":
        return currentValue === threshold;
      default:
        return false;
    }
  }

  /**
   * Evaluates current metrics against all configured alert rules.
   * Auto-fires new incidents and auto-resolves recovered metrics.
   */
  evaluateMetrics(metrics: Record<string, number>): OperationalAlertIncident[] {
    const now = new Date().toISOString();

    for (const rule of this.rules.values()) {
      const currentValue = metrics[rule.metric];
      if (currentValue === undefined) continue;

      const isBreaching = this.testCondition(rule.condition, currentValue, rule.threshold);
      const dedupKey = rule.id;

      // Find if we already have an active (firing or acknowledged) incident for this rule
      const existingActiveIncident = this.incidents.find(
        (inc) => inc.deduplicationKey === dedupKey && (inc.status === "firing" || inc.status === "acknowledged")
      );

      if (isBreaching) {
        if (existingActiveIncident) {
          // Update the current value in-place
          existingActiveIncident.currentValue = currentValue;
        } else {
          // Fire a new incident
          const incident: OperationalAlertIncident = {
            id: `inc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            ruleId: rule.id,
            name: rule.name,
            severity: rule.severity,
            status: "firing",
            message: `${rule.name}: current ${currentValue}${rule.unit} breaches threshold ${rule.threshold}${rule.unit}`,
            currentValue,
            threshold: rule.threshold,
            unit: rule.unit,
            deduplicationKey: dedupKey,
            triggeredAt: now,
          };

          this.incidents.unshift(incident);
          if (this.incidents.length > this.maxStoredIncidents) {
            this.incidents.pop();
          }

          logger.warn("observability.alert_fired", incident.message, {
            metadata: {
              ruleId: rule.id,
              severity: rule.severity,
              currentValue,
              threshold: rule.threshold,
            },
          });
        }
      } else {
        // Not breaching. If there's an active incident, resolve it.
        if (existingActiveIncident) {
          existingActiveIncident.status = "resolved";
          existingActiveIncident.resolvedAt = now;
          existingActiveIncident.currentValue = currentValue;

          logger.info(
            "observability.alert_resolved",
            `Alert resolved: ${rule.name} recovered to ${currentValue}${rule.unit}`,
            {
              metadata: {
                ruleId: rule.id,
                currentValue,
                threshold: rule.threshold,
              },
            }
          );
        }
      }
    }

    return this.getActiveIncidents();
  }

  acknowledgeIncident(incidentId: string, acknowledgedBy: string = "sre_operator"): boolean {
    const incident = this.incidents.find((i) => i.id === incidentId);
    if (!incident) return false;

    if (incident.status === "firing") {
      incident.status = "acknowledged";
      incident.acknowledgedAt = new Date().toISOString();
      incident.acknowledgedBy = acknowledgedBy;

      logger.info("observability.alert_acknowledged", `Incident ${incident.name} acknowledged by ${acknowledgedBy}`, {
        metadata: { incidentId, acknowledgedBy },
      });
      return true;
    }

    return false;
  }

  getActiveIncidents(): OperationalAlertIncident[] {
    return this.incidents.filter((i) => i.status === "firing" || i.status === "acknowledged");
  }

  getAllIncidents(limit = 50): OperationalAlertIncident[] {
    return this.incidents.slice(0, limit);
  }

  clear(): void {
    this.incidents = [];
  }
}

export const alertEngine = new AlertEngine();
