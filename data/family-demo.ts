/** Demo scenarios for Patient & Family Connect client walkthroughs. */

export const FAMILY_DEMO_SCENARIOS = [
  {
    alertId: "al-01",
    contactId: "fc-01",
    tone: "Reassuring" as const,
    blurb: "Routine nocturnal bathroom — calm family update",
  },
  {
    alertId: "al-02",
    contactId: "fc-02",
    tone: "Action-needed" as const,
    blurb: "Prolonged absence — ask family to check in",
  },
  {
    alertId: "al-05",
    contactId: "fc-01",
    tone: "Action-needed" as const,
    blurb: "Unconfirmed fall — careful, no diagnosis language",
  },
  {
    alertId: "al-03",
    contactId: "fc-03",
    tone: "Reassuring" as const,
    blurb: "Room dwell — everyday living pattern",
  },
];
