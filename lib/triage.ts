import { getOpenTickets, type Ticket } from "@/data/tickets";
import { mockTriage, type TriageResult } from "@/lib/ai-mock";

export type TicketWithTriage = {
  ticket: Ticket;
  triage: TriageResult;
  needsReview: boolean;
  reviewStatus: "pending" | "confirmed" | "overridden";
  overrideTeam?: string;
};

export function needsHumanReview(ticket: Ticket, triage: TriageResult) {
  return (
    !!ticket.sensitive ||
    triage.category === "family_distress" ||
    triage.confidence < 70
  );
}

export function buildTriageInbox(): TicketWithTriage[] {
  return getOpenTickets().map((ticket) => {
    const triage = mockTriage(ticket);
    const needsReview = needsHumanReview(ticket, triage);
    return {
      ticket,
      triage,
      needsReview,
      reviewStatus: needsReview ? "pending" : "confirmed",
    };
  });
}

export function triageKpis(items: TicketWithTriage[]) {
  const inReview = items.filter((i) => i.needsReview && i.reviewStatus === "pending").length;
  const autoEligible = items.filter(
    (i) => !i.needsReview || i.reviewStatus === "confirmed"
  ).length;
  const avg =
    items.reduce((s, i) => s + i.triage.confidence, 0) / Math.max(items.length, 1);
  return {
    openTickets: items.length,
    autoResolvedEligible: autoEligible,
    avgConfidence: Math.round(avg),
    ticketsInReview: inReview,
  };
}
