export type ComplianceRule = {
  id: string;
  title: string;
  plainEnglish: string;
  appliesTo: ("message" | "document")[];
};

export const complianceRules: ComplianceRule[] = [
  {
    id: "cr-min-necessary",
    title: "Minimum necessary",
    plainEnglish:
      "Share only the least identifiable detail needed. Prefer role language over full name + clinical detail together.",
    appliesTo: ["message", "document"],
  },
  {
    id: "cr-no-phi-plaintext",
    title: "No PHI in plaintext channels",
    plainEnglish:
      "Do not put full name + condition, room/address, or vitals tied to identity in email/SMS/chat.",
    appliesTo: ["message"],
  },
  {
    id: "cr-consent-access",
    title: "Consent & family-access notes",
    plainEnglish:
      "Confirm recipient is an authorized caregiver before discussing presence, fall, or vitals context.",
    appliesTo: ["message", "document"],
  },
  {
    id: "cr-secure-transmission",
    title: "Secure-transmission language",
    plainEnglish:
      "Docs must state health-related notifications travel over authenticated sessions — never forward raw alert payloads by unsecured email.",
    appliesTo: ["document"],
  },
  {
    id: "cr-no-sensor-video-detail",
    title: "Limit sensor/video-derived narrative",
    plainEnglish:
      "Avoid describing video frames or precise sensor-derived body events in family plaintext.",
    appliesTo: ["message", "document"],
  },
  {
    id: "cr-vitals-identity",
    title: "Vitals without identity binding",
    plainEnglish:
      "Numeric vitals must not appear beside a resident’s full name, room, or street address in outbound copy.",
    appliesTo: ["message", "document"],
  },
];

export function rulesForPrompt(mode: "message" | "document") {
  return complianceRules
    .filter((r) => r.appliesTo.includes(mode))
    .map((r) => `- [${r.id}] ${r.title}: ${r.plainEnglish}`)
    .join("\n");
}
