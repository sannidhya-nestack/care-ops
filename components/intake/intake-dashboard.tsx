"use client";

import { useEffect, useState } from "react";
import { CountUp } from "@/components/motion/ai-motion";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  Calendar,
  Clock,
  FileText,
  HelpCircle,
  Mail,
  MessageSquare,
  PlusCircle,
  Search,
  UserRound,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ErrorBar,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  PREDICTED_TOTAL,
  arrivalSeries,
  bodySystems,
  briefingBullets,
  intakeKpis,
  missingInfoRows,
  modelConfidence,
  routingForecast,
  workflowSteps,
} from "@/data/intake-dashboard";
import { cn } from "@/lib/utils";

const KPI_ICON = {
  alert: AlertTriangle,
  file: FileText,
  help: HelpCircle,
  clock: Clock,
} as const;

const KPI_ICON_BG = {
  red: "bg-red-50 text-red-500",
  green: "bg-emerald-50 text-emerald-600",
  orange: "bg-orange-50 text-orange-500",
  blue: "bg-sky-50 text-sky-600",
} as const;

const DELTA_COLOR = {
  red: "text-red-500",
  green: "text-emerald-600",
  orange: "text-orange-500",
  blue: "text-sky-600",
} as const;

const CONF_TONE = {
  blue: "text-sky-600",
  green: "text-emerald-600",
  red: "text-red-500",
  purple: "text-violet-600",
} as const;

const CONF_ICON = {
  user: UserRound,
  calendar: Calendar,
  alert: AlertTriangle,
  plus: PlusCircle,
} as const;

function riskClass(score: number) {
  if (score >= 70) return "text-red-500 font-semibold";
  if (score >= 50) return "text-orange-500 font-semibold";
  return "text-emerald-600 font-semibold";
}

export function IntakeDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const donutData = [...bodySystems]
    .sort((a, b) => b.total - a.total)
    .map((b) => ({
      name: b.name,
      value: b.total,
      color: b.color,
    }));

  const routingData = routingForecast.map((r) => ({
    ...r,
    error: [r.band, r.band] as [number, number],
    label: `${r.value} ±${r.band}`,
  }));

  const funnelTotal = workflowSteps.reduce((s, x) => s + x.count, 0);

  return (
    <div className="min-h-full bg-[#f4f6f9] p-3 md:p-5">
      <div className="mx-auto max-w-[1480px] space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 md:space-y-5 md:p-6">
        <header className="flex flex-wrap items-center gap-3 md:gap-4">
          <h1 className="shrink-0 text-xl font-bold tracking-tight text-slate-800 md:text-2xl">
            
          </h1>
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search"
              className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none ring-sky-400/30 placeholder:text-slate-400 focus:bg-white focus:ring-2 transition-all"
            />
          </div>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <IconBtn>
              <Mail className="h-4 w-4" />
            </IconBtn>
            <IconBtn>
              <MessageSquare className="h-4 w-4" />
            </IconBtn>
            <IconBtn>
              <span className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              </span>
            </IconBtn>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/avatars/intake-user.jpg"
              alt="Profile"
              className="ml-1 h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-sm"
            />
          </div>
        </header>

        {/* KPI Cards with React Card hover elevation */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {intakeKpis.map((kpi) => {
            const Icon = KPI_ICON[kpi.icon];
            return (
              <motion.div
                key={kpi.id}
                whileHover={{ y: -4, scale: 1.015 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="group cursor-pointer rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all duration-200 hover:border-sky-300 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-600 transition-colors group-hover:text-slate-900">
                    {kpi.title}
                  </p>
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110",
                      KPI_ICON_BG[kpi.deltaTone]
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                </div>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{kpi.value}</p>
                <p className={cn("mt-1 text-sm font-medium", DELTA_COLOR[kpi.deltaTone])}>
                  {kpi.delta}
                </p>
                <p className="mt-3 border-t border-slate-100 pt-2 text-xs leading-relaxed text-slate-500">
                  {kpi.footer}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Read-Only Connected Platform Intelligence Tiles */}
        <div className="rounded-xl border border-slate-200/90 bg-gradient-to-r from-teal-50/60 via-slate-50 to-rose-50/40 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Connected Careops AI Platform Intelligence · Live Session Activity
              </p>
            </div>
            <span className="text-[11px] font-medium text-slate-500">Read-Only Session Surface</span>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white p-3 border border-slate-200/80 shadow-2xs">
              <p className="text-[11px] font-medium text-slate-500">Device Events Streamed</p>
              <p className="mt-1 text-xl font-bold text-teal-700">
                <CountUp value={14} />
              </p>
              <p className="text-[10px] text-slate-400">Gateway, Presence, Wearable</p>
            </div>

            <div className="rounded-lg bg-white p-3 border border-slate-200/80 shadow-2xs">
              <p className="text-[11px] font-medium text-slate-500">Vital Assessments Run</p>
              <p className="mt-1 text-xl font-bold text-rose-600">
                <CountUp value={8} />
              </p>
              <p className="text-[10px] text-slate-400">HR + Immobility fusion</p>
            </div>

            <div className="rounded-lg bg-white p-3 border border-slate-200/80 shadow-2xs">
              <p className="text-[11px] font-medium text-slate-500">Critical Escalations</p>
              <p className="mt-1 text-xl font-bold text-amber-600">
                <CountUp value={3} />
              </p>
              <p className="text-[10px] text-slate-400">Escalated to human queue</p>
            </div>

            <div className="rounded-lg bg-white p-3 border border-slate-200/80 shadow-2xs">
              <p className="text-[11px] font-medium text-slate-500">Avg AI Confidence</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                <CountUp value={92} />%
              </p>
              <p className="text-[10px] text-slate-400">Context-fused precision</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <motion.section
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md md:p-5"
          >
            <h2 className="text-base font-semibold text-slate-800">
              Today&apos;s{" "}
              <span className="font-normal text-slate-500">
                — A live AI triage flow for today&apos;s 312 patients intake.
              </span>
            </h2>

            <div className="relative mt-3 h-[260px] w-full">
              <p className="pointer-events-none absolute right-2 top-0 z-10 text-right text-[11px] font-medium text-sky-600">
                Predicted total 7 AM–6 PM{" "}
                <span className="text-sm font-bold text-sky-700">{PREDICTED_TOTAL}</span>
              </p>
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <LineChart data={arrivalSeries} margin={{ top: 28, right: 16, left: -8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={{ stroke: "#e2e8f0" }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 60]}
                      ticks={[0, 20, 40, 60]}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="left"
                      wrapperStyle={{ fontSize: 12, paddingBottom: 8, top: 0 }}
                      iconType="plainline"
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      name="Actual arrivals"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: "#2563eb", strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    >
                      <LabelList
                        dataKey="actual"
                        position="top"
                        offset={8}
                        style={{ fill: "#2563eb", fontSize: 10, fontWeight: 600 }}
                      />
                    </Line>
                    <Line
                      type="monotone"
                      dataKey="forecast"
                      name="Forecast arrivals"
                      stroke="#93c5fd"
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-lg bg-slate-50/50 text-xs text-slate-400">
                  Loading arrival chart...
                </div>
              )}
            </div>

            <div className="mt-5">
              <div className="flex h-4 w-full overflow-hidden rounded-md">
                {workflowSteps.map((s) => (
                  <div
                    key={s.label}
                    title={`${s.label}: ${s.count}`}
                    style={{
                      backgroundColor: s.color,
                      width: `${(s.count / funnelTotal) * 100}%`,
                      minWidth: "1.5%",
                    }}
                    className="h-full transition-opacity hover:opacity-80 cursor-pointer"
                  />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                {workflowSteps.map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: s.color }}
                    />
                    <span>
                      {s.label}: <span className="font-semibold text-slate-800">{s.count}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-[11px] font-medium text-slate-500">
                Model confidence by acuity lane
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                {modelConfidence.map((c) => {
                  const Icon = CONF_ICON[c.icon];
                  return (
                    <div
                      key={c.label}
                      className={cn("inline-flex items-center gap-1.5 text-sm font-semibold transition-transform hover:scale-105 cursor-pointer", CONF_TONE[c.tone])}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>
                        {c.label} {c.value}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.section>

          <motion.section
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md md:p-5"
          >
            <h2 className="text-base font-semibold text-slate-800">
              Clinical Acuity Body–System Distribution
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              A clinical acuity × body-system distribution for today&apos;s 312 intakes.
            </p>

            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-start">
              <div className="mx-auto h-[170px] w-[170px] shrink-0">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={78}
                        paddingAngle={1.5}
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {donutData.map((d) => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px solid #e2e8f0",
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-50/50 text-xs text-slate-400">
                    Loading...
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 overflow-x-auto">
                <table className="w-full min-w-[460px] text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-2 pr-2 font-semibold">Body system</th>
                      <th className="pb-2 pr-2 font-semibold">Total</th>
                      <th className="pb-2 pr-2 font-semibold">Same-day</th>
                      <th className="pb-2 pr-2 font-semibold">Urgent</th>
                      <th className="pb-2 pr-2 font-semibold">Emergency-risk</th>
                      <th className="pb-2 font-semibold">Red-flag phrases</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bodySystems.map((row) => (
                      <tr key={row.name} className="border-b border-slate-100 text-slate-700 hover:bg-slate-50/80 transition-colors">
                        <td className="py-1.5 pr-2">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: row.color }}
                            />
                            {row.name}
                          </span>
                        </td>
                        <td className="py-1.5 pr-2 font-medium">
                          {row.total} <span className="text-slate-400">({row.pct}%)</span>
                        </td>
                        <td className="py-1.5 pr-2">{row.sameDay}</td>
                        <td className="py-1.5 pr-2">{row.urgent}</td>
                        <td className="py-1.5 pr-2">{row.emergency}</td>
                        <td
                          className={cn(
                            "py-1.5",
                            row.redFlag !== "—" && "font-medium text-red-500"
                          )}
                        >
                          {row.redFlag}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-semibold text-slate-900">
                      <td className="pt-2 pr-2">Total</td>
                      <td className="pt-2 pr-2">312</td>
                      <td className="pt-2 pr-2">123</td>
                      <td className="pt-2 pr-2">14</td>
                      <td className="pt-2 pr-2">4</td>
                      <td className="pt-2 text-red-500">Total flags: 32</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.section>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <motion.section
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md md:p-5"
          >
            <h2 className="text-sm font-semibold text-slate-800">
              Missing Information to Resolve{" "}
              <span className="font-normal text-slate-500">(AI risk-ranked exception table)</span>
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[320px] text-left text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-2 pr-2 font-semibold">Rank</th>
                    <th className="pb-2 pr-2 font-semibold">Missing information</th>
                    <th className="pb-2 pr-2 font-semibold">Cases</th>
                    <th className="pb-2 pr-2 font-semibold">Risk score</th>
                    <th className="pb-2 font-semibold">Auto-prompt success forecast</th>
                  </tr>
                </thead>
                <tbody>
                  {missingInfoRows.map((row) => (
                    <tr key={row.rank} className="border-b border-slate-100 text-slate-700 hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 pr-2 font-semibold text-slate-500">{row.rank}</td>
                      <td className="py-2 pr-2">{row.info}</td>
                      <td className="py-2 pr-2 font-medium">{row.cases}</td>
                      <td className={cn("py-2 pr-2", riskClass(row.risk))}>{row.risk}/100</td>
                      <td className="py-2 font-semibold text-emerald-600">{row.forecast}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>

          <motion.section
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md md:p-5"
          >
            <h2 className="text-sm font-semibold text-slate-800">
              Next–Best Routing Forecast{" "}
              <span className="font-normal text-slate-500">(Routing forecast with confidence bands)</span>
            </h2>
            <div className="mt-2 h-[260px] w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart
                    layout="vertical"
                    data={routingData}
                    margin={{ top: 4, right: 48, left: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, 50]}
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="route"
                      width={128}
                      tick={{ fontSize: 10, fill: "#475569" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                      formatter={(value: number, _n, props) => [
                        `${value} ±${(props.payload as { band: number }).band}`,
                        "Cases",
                      ]}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
                      {routingData.map((r) => (
                        <Cell key={r.route} fill={r.color} />
                      ))}
                      <ErrorBar dataKey="error" width={4} strokeWidth={1.5} stroke="#64748b" />
                      <LabelList
                        dataKey="label"
                        position="right"
                        style={{ fill: "#475569", fontSize: 10, fontWeight: 600 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-lg bg-slate-50/50 text-xs text-slate-400">
                  Loading forecast chart...
                </div>
              )}
            </div>
          </motion.section>

          <motion.section
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md md:p-5"
          >
            <h2 className="text-sm font-semibold text-slate-800">AI Intake Briefing</h2>
            <ul className="mt-4 space-y-3">
              {briefingBullets.map((b) => (
                <li key={b} className="flex gap-2.5 text-sm leading-relaxed text-slate-700 hover:text-slate-900 transition-colors">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </motion.section>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
    >
      {children}
    </button>
  );
}
