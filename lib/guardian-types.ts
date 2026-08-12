export type PhiFinding = {
  span: string;
  type: string;
  risk: "low" | "medium" | "high";
  start: number;
  end: number;
};

export type GuardianResult = {
  phi_findings: PhiFinding[];
  hipaa_risk_level: "low" | "medium" | "high";
  redacted_version: string;
  recommendation: string;
  source: "live" | "mock";
};
