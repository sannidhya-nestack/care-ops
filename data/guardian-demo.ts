/** Demo drafts for Compliance Guardian — PHI-risky vs care-circle safe. */

export const GUARDIAN_DEMO_SAMPLES = [
  {
    id: "g-risk-1",
    label: "Risky · diagnosis + MRN",
    tab: "message" as const,
    risk: "high" as const,
    text: `Hi Maya — Mom was diagnosed with mild dementia last Tuesday (MRN: 4829103, DOB: 03/12/1941). Her SpO2 dropped to 91% overnight and blood pressure was 158/94. Please keep this private.`,
  },
  {
    id: "g-risk-2",
    label: "Risky · SSN + email",
    tab: "message" as const,
    risk: "high" as const,
    text: `Quick note for billing: resident SSN 312-55-8842, email helen.rivera@homebox.mail, ACCT-88421. She fell in the living room — medication list attached.`,
  },
  {
    id: "g-safe-1",
    label: "Safer · routine alert (no PHI)",
    tab: "message" as const,
    risk: "low" as const,
    text: `Hi Maya,\n\nJust a calm update: home monitoring noted overnight bathroom activity within the usual pattern. No emergency signal right now — we'll only call if something needs action.\n\n— CareOps care circle`,
  },
  {
    id: "g-doc-1",
    label: "Doc · feature guide excerpt",
    tab: "document" as const,
    risk: "low" as const,
    text: `Feature guide excerpt: Quiet hours mute nocturnal-bathroom, prolonged-absence, room-dwell, and sleep-timing notifications. Safety events (fall, panic) stay on. Do not store full SSN or MRN in family-facing templates. Prefer “routine pattern” language over diagnoses.`,
  },
];
