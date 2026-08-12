export type TeamId =
  | "install-hardware"
  | "connectivity"
  | "billing"
  | "app-support"
  | "care-family";

export type TicketCategory =
  | "sensor_pairing"
  | "gateway_range"
  | "gateway_offline"
  | "wearable_sync"
  | "subscription_billing"
  | "app_howto"
  | "hardware_rma"
  | "family_distress";

export type Team = {
  id: TeamId;
  name: string;
  description: string;
  slaHours: number;
};

export const teams: Team[] = [
  {
    id: "install-hardware",
    name: "Install & Hardware",
    description: "Sensor pairing, mounting, RMA, kit fulfillment.",
    slaHours: 24,
  },
  {
    id: "connectivity",
    name: "Connectivity",
    description: "Gateway Wi-Fi, range, offline recovery.",
    slaHours: 8,
  },
  {
    id: "billing",
    name: "Billing",
    description: "Subscriptions, invoices, plan changes.",
    slaHours: 48,
  },
  {
    id: "app-support",
    name: "App Support",
    description: "App settings, notifications, how-to.",
    slaHours: 24,
  },
  {
    id: "care-family",
    name: "Care/Family Liaison",
    description: "Sensitive family outreach — always human-reviewed.",
    slaHours: 2,
  },
];

export const CATEGORY_TEAM: Record<TicketCategory, TeamId> = {
  sensor_pairing: "install-hardware",
  gateway_range: "connectivity",
  gateway_offline: "connectivity",
  wearable_sync: "install-hardware",
  subscription_billing: "billing",
  app_howto: "app-support",
  hardware_rma: "install-hardware",
  family_distress: "care-family",
};

export const CATEGORY_LABEL: Record<TicketCategory, string> = {
  sensor_pairing: "Sensor pairing",
  gateway_range: "Gateway out of range",
  gateway_offline: "Gateway offline",
  wearable_sync: "Wearable sync",
  subscription_billing: "Subscription / billing",
  app_howto: "App how-to",
  hardware_rma: "Hardware RMA",
  family_distress: "Family distress",
};

export function getTeam(id: TeamId) {
  return teams.find((t) => t.id === id)!;
}
