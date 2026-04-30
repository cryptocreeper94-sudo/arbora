import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays, ChevronLeft, ChevronRight, Loader2, Plus
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import type { ArboristJob, ArboristClient } from "@shared/schema";

const statusColors: Record<string, { bg: string; text: string }> = {
  scheduled: { bg: "rgba(245,158,11,0.15)", text: "#f59e0b" },
  "in-progress": { bg: "rgba(16,185,129,0.15)", text: "#10b981" },
  completed: { bg: "rgba(148,163,184,0.15)", text: "#94a3b8" },
};

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function ArboraCalendar() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { data: jobs, isLoading } = useQuery<ArboristJob[]>({ queryKey: ["/api/arborist/jobs"] });
  const { data: clients } = useQuery<ArboristClient[]>({ queryKey: ["/api/arborist/clients"] });
  const jobsList = jobs || [];
  const clientsList = clients || [];

  const getClientName = (cId: number | null) => cId ? clientsList.find((c) => c.id === cId)?.name || null : null;

  const jobsByDate: Record<string, ArboristJob[]> = {};
  jobsList.forEach((job) => {
    if (job.scheduledDate) {
      if (!jobsByDate[job.scheduledDate]) jobsByDate[job.scheduledDate] = [];
      jobsByDate[job.scheduledDate].push(job);
    }
  });

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
    setSelectedDay(null);
  };

  const goToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDay(null);
  };

  const formatDate = (day: number) => {
    const m = String(currentMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${currentYear}-${m}-${d}`;
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const selectedJobs = selectedDay ? (jobsByDate[selectedDay] || []) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#c2703e" }} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-6 md:py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <CalendarDays className="w-7 h-7" style={{ color: "#c2703e" }} />
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "#f1f5f9" }} data-testid="text-calendar-title">Calendar</h1>
        </div>
        <p className="text-sm" style={{ color: "#94a3b8" }}>View scheduled jobs by date</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <Card className="p-5 border-0" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div className="flex items-center justify-between mb-4">
              <Button size="icon" variant="ghost" onClick={prevMonth} data-testid="button-prev-month">
                <ChevronLeft className="w-5 h-5" style={{ color: "#94a3b8" }} />
              </Button>
              <h2 className="text-lg font-semibold" style={{ color: "#f1f5f9" }} data-testid="text-current-month">{monthName}</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToday} className="text-xs" data-testid="button-today">Today</Button>
                <Button size="icon" variant="ghost" onClick={nextMonth} data-testid="button-next-month">
                  <ChevronRight className="w-5 h-5" style={{ color: "#94a3b8" }} />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((d) => (
                <div key={d} className="text-center text-xs font-medium py-2" style={{ color: "#64748b" }}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-12" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = formatDate(day);
                const hasJobs = !!jobsByDate[dateStr];
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDay;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(dateStr)}
                    className="h-12 rounded-lg flex flex-col items-center justify-center relative transition-colors"
                    style={{
                      background: isSelected ? "rgba(194,112,62,0.2)" : isToday ? "rgba(255,255,255,0.06)" : "transparent",
                      color: isSelected ? "#c2703e" : isToday ? "#f1f5f9" : "#e2e8f0",
                      border: isSelected ? "1px solid rgba(194,112,62,0.4)" : "1px solid transparent",
                    }}
                    data-testid={`calendar-day-${dateStr}`}
                  >
                    <span className="text-sm font-medium">{day}</span>
                    {hasJobs && (
                      <div className="w-1.5 h-1.5 rounded-full absolute bottom-1.5" style={{ background: "#c2703e" }} />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="lg:w-80">
          <Card className="p-5 border-0" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>
                {selectedDay ? new Date(selectedDay + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) : "Select a day"}
              </h3>
              <Link href="/arbora/jobs">
                <Button variant="outline" size="sm" className="gap-1 text-xs" data-testid="button-add-job-from-calendar">
                  <Plus className="w-3 h-3" /> New Job
                </Button>
              </Link>
            </div>
            {!selectedDay ? (
              <p className="text-xs py-6 text-center" style={{ color: "#64748b" }}>Click a day to see scheduled jobs</p>
            ) : selectedJobs.length === 0 ? (
              <p className="text-xs py-6 text-center" style={{ color: "#64748b" }}>No jobs scheduled for this day</p>
            ) : (
              <div className="space-y-3">
                {selectedJobs.map((job) => {
                  const sc = statusColors[job.status || "scheduled"] || statusColors.scheduled;
                  return (
                    <div key={job.id} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.04)" }} data-testid={`calendar-job-${job.id}`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-medium" style={{ color: "#e2e8f0" }}>{job.title}</h4>
                        <Badge className="text-[10px]" style={{ background: sc.bg, color: sc.text, border: "none" }} data-testid={`badge-calendar-job-status-${job.id}`}>{job.status}</Badge>
                      </div>
                      {getClientName(job.clientId) && (
                        <p className="text-xs" style={{ color: "#94a3b8" }}>{getClientName(job.clientId)}</p>
                      )}
                      {job.estimatedCost != null && (
                        <p className="text-xs mt-1" style={{ color: "#64748b" }}>${Number(job.estimatedCost).toFixed(2)}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
