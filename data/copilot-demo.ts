/** CareOps AI KB packs + real support questions for Ops Copilot walkthroughs. */

export const COPILOT_DEMO_DOCS = [
  {
    id: "demo-careops-intro",
    title: "CareOps AI Agent — System Overview & Support Guidelines",
    text: `You are CareOps AI Ops Copilot for Senior Safety Support Operations. When greeted with hi, hello, hey, or who are you, greet warmly, introduce yourself as CareOps AI Ops Copilot, and offer to assist with AI Gateway 90ft range & placement, mmWave radar fall sensor calibration, camera-free zero-privacy protocol, CareOps Wearable vital sync & emergency SOS, gateway LED troubleshooting, subscription billing, and explaining routine nocturnal alerts to families.`,
  },
  {
    id: "demo-gateway-90ft",
    title: "AI Gateway — Installation & 90ft Placement Standard",
    text: `Indoor reliable radio ~90 ft line-of-sight. Drywall and plaster shorten range; concrete walls reduce RF by 40-60%. Out-of-range banner means placement or RF relay node — not firmware reset first. Move Gateway toward midpoint of sensor cluster, elevated 3.5–5 ft on central wall. Wait 5 minutes, then trigger Devices -> Refresh. Never sell consumer Wi-Fi extenders as sensor-radio fix.`,
  },
  {
    id: "demo-mmwave-fall",
    title: "mmWave Radar — Non-Invasive Fall Detection & Boundary Calibration",
    text: `Uses micro-Doppler 60GHz mmWave radar for fall detection with 100% privacy — ZERO optical cameras or lenses. Detects rapid drop below 18 inches (<0.8s) and impact energy without vertical kinetic motion (>15s). Calibrate ceiling/wall sensor at 7.5-8.5 ft height with 15-degree downward angle. Exclude ceiling fans and small pets under 25 lbs via Room Scanner app.`,
  },
  {
    id: "demo-wearable-sos",
    title: "CareOps Smart Wearable — Vital Sync & Emergency SOS Protocol",
    text: `Continuous vital signs (heart rate, SpO2) and tactile emergency SOS button. Pressing red SOS button for 2.0s triggers high-priority emergency alert with 3 haptic pulses. Vitals sync via BLE 5.3 within 30 ft of Gateway or smartphone. If sync stale: toggle Bluetooth, turn OFF iOS Low Power Mode overnight, hold band 3 ft from Gateway for 45s force sync.`,
  },
  {
    id: "demo-nocturnal-motion",
    title: "Nocturnal Motion & Overnight Bathroom Tracking Playbook",
    text: `Routine alerts (nocturnal-bathroom, prolonged-absence, room-dwell, sleep-timing) explain monitoring patterns to families — they are not new clinical detections. Script for worried families: acknowledge worry, explain pattern in plain words, offer Quiet Hours (10pm-6am) or threshold tuning (15m to 25m grace period), keep Safety events (falls/SOS) on instant priority.`,
  },
  {
    id: "demo-billing-subs",
    title: "Home Plus Subscription & Add-On Renewal Management",
    text: `Subscriber charged $79 Home Plus vs $49 Essential due to Wearable Insight promo auto-enrollment. Support SOP: pull account details + last invoice, compare to stated plan, route Billing for statement credit next billing cycle, cancel add-on for next cycle, confirm final charge date. Do not promise instant cash refunds over chat without Tier-2 approval.`,
  },
];

export const COPILOT_DEMO_QUESTIONS = [
  "Hi! What can you help me with today?",
  "How do I fix an AI Gateway out of range (~90 ft)?",
  "How does mmWave radar detect falls without cameras?",
  "Explain nocturnal-bathroom alerts to a worried family",
  "Wearable vitals not syncing — what should support try first?",
  "Subscriber charged for Wearable Insight add-on — what is the SOP?",
  "Gateway LED solid red after outage — Wi-Fi recovery steps?",
];
