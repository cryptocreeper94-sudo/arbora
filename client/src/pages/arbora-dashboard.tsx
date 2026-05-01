import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Briefcase, FileText, Calculator, HardHat, Package, DollarSign,
  TrendingUp, AlertTriangle, Clock, Loader2, ArrowRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import type { ArboristClient, ArboristJob, ArboristInvoice, ArboristDeal, ArboristEstimate, ArboristCrewMember, ArboristInventoryItem } from "@shared/schema";
import arboraSplash from "@assets/arbora-splash-bg.png";
import { useAuth } from "@/hooks/use-auth";
import { SubscriptionBanner } from "@/components/subscription-banner";

function StatCard({ icon: Icon, label, value, sub, color, href }: { icon: any; label: string; value: string | number; sub?: string; color: string; href: string }) {
  return (
    <Link href={href}>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Card className="p-5 cursor-pointer border-0" style={{ background: "rgba(255,255,255,0.04)", borderLeft: `3px solid ${color}` }} data-testid={`stat-card-${label.toLowerCase().replace(/\s+/g, '-')}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: "#64748b" }}>{label}</p>
              <p className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>{value}</p>
              {sub && <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>{sub}</p>}
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}

export default function ArboraDashboard() {
  const { user } = useAuth();
  const { data: clients } = useQuery<ArboristClient[]>({ queryKey: ["/api/arborist/clients"] });
  const { data: jobs } = useQuery<ArboristJob[]>({ queryKey: ["/api/arborist/jobs"] });
  const { data: invoices } = useQuery<ArboristInvoice[]>({ queryKey: ["/api/arborist/invoices"] });
  const { data: deals } = useQuery<ArboristDeal[]>({ queryKey: ["/api/arborist/deals"] });
  const { data: estimates } = useQuery<ArboristEstimate[]>({ queryKey: ["/api/arborist/estimates"] });
  const { data: crew } = useQuery<ArboristCrewMember[]>({ queryKey: ["/api/arborist/crew"] });
  const { data: inventory } = useQuery<ArboristInventoryItem[]>({ queryKey: ["/api/arborist/inventory"] });
  const { data: lowStock } = useQuery<ArboristInventoryItem[]>({ queryKey: ["/api/arborist/inventory/low-stock"] });

  const activeJobs = (jobs || []).filter(j => j.status === "in-progress" || j.status === "scheduled");
  const unpaidInvoices = (invoices || []).filter(i => i.status === "sent" || i.status === "overdue");
  const unpaidTotal = unpaidInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const openDeals = (deals || []).filter(d => d.stage !== "won" && d.stage !== "lost");
  const dealsPipelineValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-6 md:py-10">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative rounded-2xl overflow-hidden mb-8" style={{ minHeight: 180 }}>
        <img src={arboraSplash} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(194,112,62,0.3))" }} />
        <div className="relative p-6 md:p-10">
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "#f1f5f9" }} data-testid="text-arbora-title">Arbora Command Center</h1>
          <p className="text-sm md:text-base" style={{ color: "#94a3b8" }}>Professional arborist business management</p>
        </div>
      </motion.div>

      {!user && (
        <SubscriptionBanner
          tier="Arborist Starter"
          price="$49/mo"
          features={[
            "Manage up to 25 clients",
            "Job scheduling and tracking",
            "Estimates and invoicing",
            "Equipment management via GarageBot",
            "Crew and inventory tracking",
          ]}
          className="mb-6"
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Clients" value={(clients || []).length} color="#c2703e" href="/arbora/clients" />
        <StatCard icon={Briefcase} label="Active Jobs" value={activeJobs.length} sub={`${(jobs || []).length} total`} color="#10b981" href="/arbora/jobs" />
        <StatCard icon={TrendingUp} label="Pipeline Value" value={`$${dealsPipelineValue.toLocaleString()}`} sub={`${openDeals.length} open deals`} color="#f59e0b" href="/arbora/deals" />
        <StatCard icon={DollarSign} label="Outstanding" value={`$${unpaidTotal.toLocaleString()}`} sub={`${unpaidInvoices.length} unpaid`} color="#ef4444" href="/arbora/invoices" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 border-0" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>Recent Jobs</h2>
            <Link href="/arbora/jobs">
              <span className="text-xs cursor-pointer flex items-center gap-1" style={{ color: "#c2703e" }}>View all <ArrowRight className="w-3 h-3" /></span>
            </Link>
          </div>
          {(jobs || []).length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: "#64748b" }}>No jobs yet</p>
          ) : (
            <div className="space-y-3">
              {(jobs || []).slice(0, 5).map((job) => (
                <div key={job.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#e2e8f0" }}>{job.title}</p>
                    <p className="text-xs" style={{ color: "#64748b" }}>{job.scheduledDate || "Unscheduled"}</p>
                  </div>
                  <Badge className="text-[10px]" style={{
                    background: job.status === "completed" ? "rgba(16,185,129,0.15)" : job.status === "in-progress" ? "rgba(245,158,11,0.15)" : "rgba(148,163,184,0.15)",
                    color: job.status === "completed" ? "#10b981" : job.status === "in-progress" ? "#f59e0b" : "#94a3b8",
                    border: "none"
                  }}>{job.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 border-0" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>Quick Stats</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg p-3" style={{ background: "rgba(194,112,62,0.08)" }}>
              <Calculator className="w-4 h-4 mb-1" style={{ color: "#c2703e" }} />
              <p className="text-lg font-bold" style={{ color: "#f1f5f9" }}>{(estimates || []).length}</p>
              <p className="text-[10px]" style={{ color: "#64748b" }}>Estimates</p>
            </div>
            <div className="rounded-lg p-3" style={{ background: "rgba(16,185,129,0.08)" }}>
              <HardHat className="w-4 h-4 mb-1" style={{ color: "#10b981" }} />
              <p className="text-lg font-bold" style={{ color: "#f1f5f9" }}>{(crew || []).filter(c => c.isActive).length}</p>
              <p className="text-[10px]" style={{ color: "#64748b" }}>Active Crew</p>
            </div>
            <div className="rounded-lg p-3" style={{ background: "rgba(245,158,11,0.08)" }}>
              <Package className="w-4 h-4 mb-1" style={{ color: "#f59e0b" }} />
              <p className="text-lg font-bold" style={{ color: "#f1f5f9" }}>{(inventory || []).length}</p>
              <p className="text-[10px]" style={{ color: "#64748b" }}>Inventory Items</p>
            </div>
            <div className="rounded-lg p-3" style={{ background: (lowStock || []).length > 0 ? "rgba(239,68,68,0.08)" : "rgba(148,163,184,0.08)" }}>
              <AlertTriangle className="w-4 h-4 mb-1" style={{ color: (lowStock || []).length > 0 ? "#ef4444" : "#94a3b8" }} />
              <p className="text-lg font-bold" style={{ color: "#f1f5f9" }}>{(lowStock || []).length}</p>
              <p className="text-[10px]" style={{ color: "#64748b" }}>Low Stock</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
