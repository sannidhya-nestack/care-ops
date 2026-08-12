export type VitalResident = {
  id: string;
  name: string;
  age: number;
  room: string;
  account: string;
  baselineHR: number;
  baselineSpO2: number;
  conditions: string[];
  mobilityLevel: "Independent" | "Assisted (Walker)" | "Wheelchair" | "Bedbound";
  fallHistory: string;
  currentHR: number;
  currentSpO2: number;
  currentActivity: number;
  immobilityMins: number;
  restingHR3DayTrend: number[];
  timeSeries24h: {
    time: string;
    hr: number;
    spo2: number;
    activity: number;
    immobility: boolean;
  }[];
  activeEvent?: {
    type: "presence_no_motion" | "fall_detected" | "spo2_dip" | "hr_drift";
    description: string;
    immobilityMins: number;
    hr: number;
    spo2: number;
  };
};

export const VITALS_RESIDENTS_SEED: VitalResident[] = [
  {
    id: "res-01",
    name: "Priya Reynolds (Mom)",
    age: 82,
    room: "Living room & Bedroom 102",
    account: "ACCT-88421",
    baselineHR: 72,
    baselineSpO2: 96,
    conditions: ["Hypertension", "Mild Cognitive Impairment"],
    mobilityLevel: "Assisted (Walker)",
    fallHistory: "1 fall logged 2 months ago (Bedside)",
    currentHR: 118,
    currentSpO2: 94,
    currentActivity: 5,
    immobilityMins: 45,
    restingHR3DayTrend: [72, 75, 78],
    activeEvent: {
      type: "presence_no_motion",
      description: "Active-IR Bed Presence Sensor immobility 45m (Daytime 2:15pm) with elevated HR (118 bpm)",
      immobilityMins: 45,
      hr: 118,
      spo2: 94,
    },
    timeSeries24h: [
      { time: "06:00", hr: 70, spo2: 97, activity: 12, immobility: false },
      { time: "09:00", hr: 76, spo2: 96, activity: 45, immobility: false },
      { time: "12:00", hr: 74, spo2: 96, activity: 38, immobility: false },
      { time: "14:00", hr: 112, spo2: 94, activity: 4, immobility: true },
      { time: "14:15", hr: 116, spo2: 94, activity: 2, immobility: true },
      { time: "14:30", hr: 118, spo2: 94, activity: 0, immobility: true },
      { time: "14:45", hr: 115, spo2: 94, activity: 1, immobility: true },
    ],
  },
  {
    id: "res-02",
    name: "Dad Okonkwo",
    age: 79,
    room: "Suite 104",
    account: "ACCT-77102",
    baselineHR: 74,
    baselineSpO2: 95,
    conditions: ["COPD", "Type 2 Diabetes"],
    mobilityLevel: "Assisted (Walker)",
    fallHistory: "2 falls past 6 months (Hallway transit)",
    currentHR: 88,
    currentSpO2: 91,
    currentActivity: 10,
    immobilityMins: 20,
    restingHR3DayTrend: [74, 80, 86],
    activeEvent: {
      type: "hr_drift",
      description: "Resting HR upward drift +12 bpm over 3 days (74 → 86 bpm) with mild nocturnal SpO2 dip (91%)",
      immobilityMins: 20,
      hr: 88,
      spo2: 91,
    },
    timeSeries24h: [
      { time: "06:00", hr: 78, spo2: 93, activity: 10, immobility: false },
      { time: "09:00", hr: 82, spo2: 92, activity: 28, immobility: false },
      { time: "12:00", hr: 85, spo2: 92, activity: 30, immobility: false },
      { time: "15:00", hr: 88, spo2: 91, activity: 15, immobility: false },
      { time: "18:00", hr: 86, spo2: 91, activity: 12, immobility: false },
    ],
  },
  {
    id: "res-03",
    name: "Lisa Chen (Dad)",
    age: 85,
    room: "Suite 210",
    account: "ACCT-55918",
    baselineHR: 68,
    baselineSpO2: 97,
    conditions: ["Osteoarthritis", "Post-Stroke Recovery"],
    mobilityLevel: "Wheelchair",
    fallHistory: "No recent falls",
    currentHR: 66,
    currentSpO2: 97,
    currentActivity: 4,
    immobilityMins: 60,
    restingHR3DayTrend: [68, 67, 66],
    activeEvent: {
      type: "presence_no_motion",
      description: "Bed Presence Sensor night sleep 60m (11:30pm) with steady resting HR (66 bpm)",
      immobilityMins: 60,
      hr: 66,
      spo2: 97,
    },
    timeSeries24h: [
      { time: "22:00", hr: 70, spo2: 97, activity: 8, immobility: true },
      { time: "23:00", hr: 66, spo2: 97, activity: 2, immobility: true },
      { time: "00:00", hr: 65, spo2: 97, activity: 0, immobility: true },
      { time: "01:00", hr: 66, spo2: 97, activity: 0, immobility: true },
    ],
  },
  {
    id: "res-04",
    name: "Elena Vasquez (Aunt)",
    age: 88,
    room: "Unit 305",
    account: "ACCT-FAC-220",
    baselineHR: 76,
    baselineSpO2: 96,
    conditions: ["Congestive Heart Failure", "Atrial Fibrillation"],
    mobilityLevel: "Bedbound",
    fallHistory: "Bedside slip 3 weeks ago",
    currentHR: 104,
    currentSpO2: 92,
    currentActivity: 2,
    immobilityMins: 35,
    restingHR3DayTrend: [76, 88, 104],
    activeEvent: {
      type: "spo2_dip",
      description: "SpO2 drop to 92% combined with tachycardia (104 bpm) during daytime bed rest",
      immobilityMins: 35,
      hr: 104,
      spo2: 92,
    },
    timeSeries24h: [
      { time: "06:00", hr: 88, spo2: 95, activity: 5, immobility: true },
      { time: "09:00", hr: 95, spo2: 94, activity: 6, immobility: true },
      { time: "12:00", hr: 102, spo2: 93, activity: 2, immobility: true },
      { time: "15:00", hr: 104, spo2: 92, activity: 1, immobility: true },
    ],
  },
  {
    id: "res-05",
    name: "Marcus Brooks (Father)",
    age: 81,
    room: "Suite 112",
    account: "ACCT-44120",
    baselineHR: 72,
    baselineSpO2: 97,
    conditions: ["Parkinson's Disease"],
    mobilityLevel: "Assisted (Walker)",
    fallHistory: "1 fall last month (Bathroom threshold)",
    currentHR: 74,
    currentSpO2: 96,
    currentActivity: 32,
    immobilityMins: 10,
    restingHR3DayTrend: [72, 73, 74],
    timeSeries24h: [
      { time: "08:00", hr: 72, spo2: 97, activity: 25, immobility: false },
      { time: "12:00", hr: 76, spo2: 96, activity: 40, immobility: false },
      { time: "16:00", hr: 74, spo2: 96, activity: 30, immobility: false },
    ],
  },
  {
    id: "res-06",
    name: "Amy Nguyen (Grandmother)",
    age: 86,
    room: "Suite 204",
    account: "ACCT-66301",
    baselineHR: 70,
    baselineSpO2: 98,
    conditions: ["Hypertension"],
    mobilityLevel: "Independent",
    fallHistory: "No fall history",
    currentHR: 71,
    currentSpO2: 98,
    currentActivity: 48,
    immobilityMins: 5,
    restingHR3DayTrend: [70, 71, 71],
    timeSeries24h: [
      { time: "08:00", hr: 68, spo2: 98, activity: 35, immobility: false },
      { time: "12:00", hr: 74, spo2: 98, activity: 55, immobility: false },
      { time: "16:00", hr: 71, spo2: 98, activity: 45, immobility: false },
    ],
  },
  {
    id: "res-07",
    name: "Ravi Patel (Uncle)",
    age: 77,
    room: "Suite 310",
    account: "ACCT-DIST-88",
    baselineHR: 75,
    baselineSpO2: 96,
    conditions: ["Coronary Artery Disease"],
    mobilityLevel: "Independent",
    fallHistory: "No fall history",
    currentHR: 78,
    currentSpO2: 96,
    currentActivity: 35,
    immobilityMins: 15,
    restingHR3DayTrend: [75, 76, 78],
    timeSeries24h: [
      { time: "08:00", hr: 74, spo2: 96, activity: 30, immobility: false },
      { time: "12:00", hr: 80, spo2: 96, activity: 42, immobility: false },
      { time: "16:00", hr: 78, spo2: 96, activity: 35, immobility: false },
    ],
  },
  {
    id: "res-08",
    name: "Jordan Hale (Mother)",
    age: 84,
    room: "Suite 118",
    account: "ACCT-91204",
    baselineHR: 73,
    baselineSpO2: 97,
    conditions: ["Mild Dementia", "Osteoporosis"],
    mobilityLevel: "Assisted (Walker)",
    fallHistory: "Nighttime wander slip 4 weeks ago",
    currentHR: 76,
    currentSpO2: 96,
    currentActivity: 22,
    immobilityMins: 12,
    restingHR3DayTrend: [73, 75, 76],
    timeSeries24h: [
      { time: "08:00", hr: 72, spo2: 97, activity: 20, immobility: false },
      { time: "12:00", hr: 78, spo2: 96, activity: 28, immobility: false },
      { time: "16:00", hr: 76, spo2: 96, activity: 22, immobility: false },
    ],
  },
];
