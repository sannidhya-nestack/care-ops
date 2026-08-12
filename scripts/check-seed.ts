/**
 * ponytail: seed + brand sanity.
 * Run: npm run check
 */
import { tickets } from "../data/tickets";
import { playbooks } from "../data/playbooks";
import { resolvedTickets } from "../data/resolvedTickets";
import { homes, GATEWAY_RANGE_FT } from "../data/homes";
import { mockTriage, mockInstallPlan } from "../lib/ai-mock";
import { needsHumanReview } from "../lib/triage";
import { readFileSync } from "fs";
import { join } from "path";

console.assert(tickets.length >= 14, "need ~14 tickets");
console.assert(playbooks.length === 6, "need 6 playbooks");
console.assert(resolvedTickets.length >= 15, "need ~15 resolved");
console.assert(GATEWAY_RANGE_FT === 90, "90ft rule");

const distress = tickets.find((t) => t.id === "tkt-008")!;
const d = mockTriage(distress);
console.assert(d.category === "family_distress", "distress category");
console.assert(d.suggested_team_id === "care-family", "distress team");
console.assert(needsHumanReview(distress, d), "distress HITL");

const plan = mockInstallPlan({
  homeDescription: "ranch with back bedroom",
  rooms: ["Living room", "Back bedroom"],
  gatewayLocation: "Living room",
});
console.assert(
  plan.placement_plan.some((p) => !p.within_range),
  "far room flagged"
);

const root = join(__dirname, "..");
const pkg = readFileSync(join(root, "package.json"), "utf8");
console.assert(!/@anthropic-ai/.test(pkg), "no anthropic dep");
console.assert(/"openai"/.test(pkg), "openai dep");
console.assert(/framer-motion/.test(pkg), "framer-motion");

const sidebar = readFileSync(join(root, "components/shell/sidebar.tsx"), "utf8");
console.assert(/CareOps AI/.test(sidebar), "brand in sidebar");
console.assert(!/Thessai/i.test(sidebar), "no Thessai brand");

const devices = readFileSync(join(root, "data/devices.ts"), "utf8");
console.assert(/bathroom_motion/.test(devices), "bathroom motion taxonomy");
console.assert(!/humidity/.test(devices), "no humidity device");

console.log(`check-seed: ok · ${homes.length} homes · ${tickets.length} tickets`);
