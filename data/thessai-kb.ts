export type KbCategory =
  | "Hardware & Gateway"
  | "Radar & Fall Sensing"
  | "Wearables & SOS"
  | "Family & Caregiver Alerts"
  | "Compliance & Subscriptions";

export type ThessaiDocument = {
  id: string;
  title: string;
  category: KbCategory;
  version: string;
  lastUpdated: string;
  author: string;
  chunks: number;
  tags: string[];
  summary: string;
  fullText: string;
};

export const THESSAI_KB_DOCUMENTS: ThessaiDocument[] = [
  {
    id: "doc-gw-90ft",
    title: "CareOps AI Gateway — Installation & 90ft Placement Standard",
    category: "Hardware & Gateway",
    version: "v3.2.0",
    lastUpdated: "2026-08-01",
    author: "Hardware Engineering Team",
    chunks: 4,
    tags: ["gateway", "placement", "range", "90ft", "hardware"],
    summary:
      "Field engineering standards for positioning the central AI Gateway to maintain reliable 90-foot indoor RF coverage across residential and senior living units.",
    fullText: `CAREOPS AI — HARDWARE MANUAL
DOCUMENT ID: DOC-GW-90FT | VERSION: 3.2.0
SUBJECT: CAREOPS AI GATEWAY INSTALLATION & 90-FOOT RANGE STANDARD

1. OVERVIEW & SPECIFICATIONS
The CareOps AI Gateway serves as the edge-compute neural hub for privacy-first senior safety monitoring. Equipped with dual mmWave radar receiver channels, Sub-1GHz sensor radio, and LTE/Wi-Fi dual-failover, the unit provides up to 90 feet of reliable indoor line-of-sight coverage.

2. OPTIMAL PLACEMENT RULES
- Elevation: Mount or place the Gateway 3.5 to 5.0 feet above ground level on a central wall or tabletop.
- Line of Sight: Position near the geometric center of the resident's living zone (hallway junction or living room).
- Obstacle Avoidance: Keep at least 3 feet away from large metal appliances (refrigerators, HVAC ducts) and thick reinforced concrete walls, which reduce RF propagation by 40-60%.

3. TROUBLESHOOTING "OUT OF RANGE" BANNERS
When a remote sensor flags "Out of Range":
a. Do NOT initiate firmware flash as first resort.
b. Inspect physical path between Gateway and sensor.
c. Relocate Gateway 5-10 feet closer to the affected sensor cluster.
d. If structural walls (brick/plaster) prevent direct path, install an approved CareOps RF Relay Node.
e. Wait 5 minutes for mesh re-negotiation, then trigger "Devices -> Refresh" in Support Console.`,
  },
  {
    id: "doc-mmwave-radar",
    title: "mmWave Radar — Non-Invasive Fall Detection & Boundary Calibration",
    category: "Radar & Fall Sensing",
    version: "v4.1.0",
    lastUpdated: "2026-07-28",
    author: "AI Sensor Algorithm Group",
    chunks: 5,
    tags: ["radar", "mmwave", "fall-detection", "privacy", "calibration"],
    summary:
      "Technical operational guide for camera-free 60GHz mmWave radar sensors, room vector mapping, ceiling mounting, and false-positive filter configuration.",
    fullText: `CAREOPS AI — CLINICAL & RADAR SPECIFICATION
DOCUMENT ID: DOC-MMWAVE-RADAR | VERSION: 4.1.0
SUBJECT: MMWAVE RADAR FALL DETECTION & ROOM BOUNDARY CALIBRATION

1. PRIVACY-FIRST RADAR ARCHITECTURE
CareOps AI utilizes micro-Doppler 60GHz mmWave radar pulses to detect point-cloud point velocities and body posture angles. NO optical cameras or image sensors are used, guaranteeing 100% resident privacy in bedrooms, bathrooms, and private living quarters.

2. FALL DETECTION LOGIC & VECTORING
- Rapid Height Transition: Sudden drop of body point-cloud centroid below 18 inches within <0.8 seconds.
- Impact Energy Measurement: Micro-doppler spectrum change indicating floor impact followed by prolonged absence of vertical kinetic motion (>15 seconds).
- Room Boundary Masking: Calibrate ceiling/wall sensor coordinates to exclude ceiling fan rotations, moving curtains, and small pets under 25 lbs.

3. SENSOR CALIBRATION PROCEDURE
Step 1: Mount Radar Sensor at 7.5–8.5 ft height angled 15 degrees downward facing the primary walking grid.
Step 2: Connect via CareOps Installer App -> Room Scanner.
Step 3: Perform "Walk Test" across 4 room corners. Confirm target silhouette tracking.
Step 4: Execute "Simulated Fall Verification" with weighted torso model to validate auto-alert dispatch.`,
  },
  {
    id: "doc-wearable-sos",
    title: "CareOps Smart Wearable — Vital Sync & Emergency SOS Protocol",
    category: "Wearables & SOS",
    version: "v2.8.1",
    lastUpdated: "2026-08-04",
    author: "Wearables Product Team",
    chunks: 3,
    tags: ["wearable", "vitals", "sos", "bluetooth", "sync"],
    summary:
      "Protocol for CareOps Wearable bands, continuous heart rate/SpO2 syncing via Bluetooth 5.3, SOS panic button escalation, and battery lifecycle.",
    fullText: `CAREOPS AI — DEVICE PROTOCOL
DOCUMENT ID: DOC-WEARABLE-SOS | VERSION: 2.8.1
SUBJECT: CAREOPS SMART WEARABLE VITAL SYNC & EMERGENCY SOS

1. DEVICE CAPABILITIES
The CareOps Smart Wearable provides continuous vital signs tracking (heart rate, pulse oximetry, skin temperature) alongside a tactile emergency SOS button. Data syncs via low-energy Bluetooth (BLE 5.3) to the nearest CareOps Gateway or mobile companion app.

2. EMERGENCY SOS BUTTON PRESS
- Pressing the recessed red button for 2.0 continuous seconds triggers an immediate High-Priority Emergency Event.
- The wearable haptically vibrates 3 times to confirm transmission.
- CareOps AI immediately alerts emergency contacts and designated care team staff via SMS, automated voice call, and push notification.

3. TROUBLESHOOTING WEARABLE SYNC ISSUES
If vital readings appear stale or offline:
a. Ensure the resident is within 30 feet of the CareOps Gateway or paired mobile smartphone.
b. Verify Bluetooth is enabled on the companion device and iOS/Android "Low Power Mode" is toggled OFF overnight.
c. Perform manual force sync: Hold wearable within 3 feet of Gateway, open Support App -> Wearables -> "Force Bluetooth Re-Sync" (wait 45 seconds).
d. Check magnetic charging pins for debris; recharge if battery < 15%.`,
  },
  {
    id: "doc-nocturnal-motion",
    title: "Nocturnal Motion & Overnight Bathroom Tracking Playbook",
    category: "Family & Caregiver Alerts",
    version: "v1.9.0",
    lastUpdated: "2026-07-22",
    author: "Clinical Support Operations",
    chunks: 4,
    tags: ["nocturnal", "bathroom", "overnight", "family", "alerts"],
    summary:
      "Support guidance for analyzing overnight bathroom visits, tuning sensitivity thresholds, and explaining routine monitoring patterns to concerned families.",
    fullText: `CAREOPS AI — SUPPORT PLAYBOOK
DOCUMENT ID: DOC-NOCTURNAL-MOTION | VERSION: 1.9.0
SUBJECT: NOCTURNAL BATHROOM MOTION & OVERNIGHT PATTERN TRACKING

1. PURPOSE & PATTERN EXPLANATION
Nocturnal bathroom motion tracking monitors resident safety during high-risk overnight hours (typically 10:00 PM – 6:00 AM). Alerts generated during this window explain routine behavioral patterns—they are NOT automatic medical diagnoses.

2. THRESHOLD DEFINITIONS
- Routine Visit: Bathroom motion detected with exit back to bedroom within 15 minutes.
- Extended Bathroom Dwell: Continuous bathroom presence exceeding 25 minutes without main room return.
- Multiple Nocturnal Visits: >3 bathroom entries within a 4-hour quiet window.

3. DE-ESCALATING FAMILY CONCERNS
When family members contact support regarding high overnight alert counts:
- Script: "CareOps AI tracks motion patterns to ensure safety during dark hours. A nocturnal bathroom alert indicates your loved one was active in the bathroom during quiet hours, allowing care staff to verify safety if dwell time extends."
- Action: Offer to adjust "Quiet Hours Window" or increase the "Dwell Time Grace Period" from 15 to 25 minutes to match individual resident sleep/bathroom routines. Always maintain Safety (Fall/SOS) events on instant priority.`,
  },
  {
    id: "doc-zero-camera",
    title: "Zero-Camera Privacy Protocol & Sensor-Only Architecture",
    category: "Compliance & Subscriptions",
    version: "v5.0.0",
    lastUpdated: "2026-08-05",
    author: "Privacy & Compliance Office",
    chunks: 3,
    tags: ["privacy", "zero-camera", "hipaa", "compliance", "dignity"],
    summary:
      "Core architectural commitment to resident dignity: zero video optical recording, radar point-cloud encryption, and privacy compliance.",
    fullText: `CAREOPS AI — PRIVACY & COMPLIANCE
DOCUMENT ID: DOC-ZERO-CAMERA | VERSION: 5.0.0
SUBJECT: ZERO-CAMERA PRIVACY PROTOCOL & SENSOR-ONLY ARCHITECTURE

1. CORE PRIVACY MANDATE
CareOps AI was founded on the fundamental principle that senior citizens deserve safety without surveillance. CareOps products contain ZERO video cameras, optical lenses, or microphone eavesdropping hardware.

2. DATA ENCRYPTION & ANONYMIZATION
- Point-Cloud Vectors: mmWave radar signals process spatial coordinate velocities at the edge (on the Gateway). Raw RF reflections are converted into mathematical point vectors and immediately discarded.
- AES-256 Encryption: All telemetry transmitted to the CareOps Cloud is encrypted using AES-256 bit encryption in transit (TLS 1.3) and at rest.
- HIPAA Compliance: CareOps Cloud infrastructure adheres to strict HIPAA Guidelines and SOC2 Type II security frameworks. Family access features use role-based security to ensure zero unauthorized PHI exposure.`,
  },
  {
    id: "doc-gw-led",
    title: "Gateway LED Diagnostic Codes & Connectivity Recovery",
    category: "Hardware & Gateway",
    version: "v2.1.0",
    lastUpdated: "2026-07-15",
    author: "Tier-2 Technical Support",
    chunks: 3,
    tags: ["led", "gateway", "diagnostic", "wifi", "offline"],
    summary:
      "Field guide for diagnosing AI Gateway front LED status colors, Wi-Fi reconnection sequences, and power-cycle procedures.",
    fullText: `CAREOPS AI — TIER-2 FIELD GUIDE
DOCUMENT ID: DOC-GW-LED | VERSION: 2.1.0
SUBJECT: GATEWAY LED DIAGNOSTIC CODES & RECOVERY

1. LED INDICATOR STATUS GUIDE
- Solid Green: Gateway connected to CareOps Cloud; local sensor mesh active.
- Flashing Amber: Gateway searching for Wi-Fi SSID or acquiring cellular IP lease.
- Solid Red: Cloud connection failed or local network credentials invalid.
- Flashing Blue: Gateway in Installer BLE Pairing Mode.

2. STEP-BY-STEP WI-FI RECOVERY
Step 1: Confirm home Wi-Fi router is operating by checking internet connection on another mobile device.
Step 2: Unplug Gateway power cable, wait 30 seconds, then re-insert power plug. Allow 2 full minutes for boot cycle.
Step 3: If LED turns Solid Red, press and hold the rear Recessed Reset Button for 5 seconds until front LED flashes Blue.
Step 4: Re-open CareOps App -> Network Settings -> Select Wi-Fi SSID and enter credentials. Do NOT perform full 15-second factory wipe unless instructed by Tier-3 Operations.`,
  },
  {
    id: "doc-billing-subs",
    title: "Home Plus Subscription & Add-On Renewal Management",
    category: "Compliance & Subscriptions",
    version: "v1.4.0",
    lastUpdated: "2026-07-30",
    author: "Customer Success & Billing Operations",
    chunks: 3,
    tags: ["billing", "subscription", "renewal", "add-on", "invoice"],
    summary:
      "Standard Operating Procedure for handling subscription plan adjustments, Wearable Insight promo conversions, and invoice line-item inquiries.",
    fullText: `CAREOPS AI — BILLING SOP
DOCUMENT ID: DOC-BILLING-SUBS | VERSION: 1.4.0
SUBJECT: HOME PLUS SUBSCRIPTION & ADD-ON RENEWAL MANAGEMENT

1. SUBSCRIPTION TIERS
- CareOps Home Essential ($49/mo): Central AI Gateway + 2 mmWave Fall Sensors + Basic Caregiver Push Alerts.
- CareOps Home Plus ($79/mo): Essential Tier + Wearable Sync + 24/7 Priority Emergency Dispatch + Family Portal Multi-User Access.

2. HANDLING RENEWAL INQUIRIES
When a subscriber inquires about billing price adjustments:
- Step 1: Open Billing Operations Tool -> Enter Account ID -> Review active plan and line-item add-ons.
- Step 2: If subscriber was auto-enrolled into a Wearable Insight promo trial, verify if promo period expired.
- Step 3: If unauthorized, apply statement credit for the delta and issue subscription downgrade for the subsequent billing cycle.
- Step 4: Always send written confirmation statement via email. Support representatives must never promise immediate cash refunds over chat without Tier-2 Approval.`,
  },
  {
    id: "doc-caregiver-tuning",
    title: "Caregiver Notification Frequency & Quiet Hours Configuration",
    category: "Family & Caregiver Alerts",
    version: "v2.0.0",
    lastUpdated: "2026-08-02",
    author: "Caregiver Experience Team",
    chunks: 3,
    tags: ["notification", "quiet-hours", "frequency", "caregiver", "tuning"],
    summary:
      "How to balance family notification peace-of-mind with alert fatigue prevention by configuring Quiet Hours, delay timers, and escalation roles.",
    fullText: `CAREOPS AI — USER EXPERIENCE GUIDE
DOCUMENT ID: DOC-CAREGIVER-TUNING | VERSION: 2.0.0
SUBJECT: CAREGIVER NOTIFICATION FREQUENCY & QUIET HOURS CONFIGURATION

1. PREVENTING ALERT FATIGUE
Caregivers receiving frequent routine motion notifications may experience alert fatigue. Support agents should assist caregivers in tailoring notification settings while ensuring critical Safety Events (falls, panic SOS) remain active 24/7.

2. CONFIGURATION STEPS IN APP
- Quiet Hours: Navigate to Settings -> Notifications -> Quiet Hours. Set window (e.g., 10:00 PM to 7:00 AM). During Quiet Hours, non-urgent routine alerts are logged in daily digest without ringing phone.
- Extended Absence Delay: Adjust "No Motion Expected Window" from 60 minutes to 120 minutes during daytime outings.
- Care Circle Roles: Designate Primary Caregiver (receives all alerts) vs Secondary Family Members (receive daily summary digest only).`,
  },
];
