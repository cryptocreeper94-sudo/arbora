import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  HardHat, Plus, Trash2, Loader2, Mail, Phone, DollarSign, Clock, CheckCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ArboristCrewMember, ArboristTimeEntry, ArboristJob } from "@shared/schema";

const roles = ["climber", "ground-crew", "operator", "foreman", "apprentice"];

export default function ArboraCrew() {
  const { toast } = useToast();
  const [crewDialogOpen, setCrewDialogOpen] = useState(false);
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("climber");
  const [hourlyRate, setHourlyRate] = useState("");

  const [teCrew, setTeCrew] = useState("");
  const [teJob, setTeJob] = useState("");
  const [teDate, setTeDate] = useState("");
  const [teHours, setTeHours] = useState("");
  const [teOvertime, setTeOvertime] = useState("");
  const [teNotes, setTeNotes] = useState("");

  const { data: crew, isLoading } = useQuery<ArboristCrewMember[]>({ queryKey: ["/api/arborist/crew"] });
  const { data: timeEntries } = useQuery<ArboristTimeEntry[]>({ queryKey: ["/api/arborist/time-entries"] });
  const { data: jobs } = useQuery<ArboristJob[]>({ queryKey: ["/api/arborist/jobs"] });
  const crewList = crew || [];
  const teList = timeEntries || [];
  const jobsList = jobs || [];

  const getCrewName = (id: number | null) => {
    if (!id) return "—";
    const m = crewList.find((c) => c.id === id);
    return m ? `${m.firstName} ${m.lastName}` : "Unknown";
  };
  const getJobTitle = (id: number | null) => {
    if (!id) return "—";
    return jobsList.find((j) => j.id === id)?.title || "Unknown";
  };

  const createCrew = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/arborist/crew", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/arborist/crew"] });
      setCrewDialogOpen(false);
      resetCrewForm();
      toast({ title: "Crew member added", description: "New crew member has been created." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add crew member.", variant: "destructive" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/arborist/crew/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/arborist/crew"] });
      toast({ title: "Updated", description: "Crew member status changed." });
    },
  });

  const deleteCrew = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/arborist/crew/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/arborist/crew"] });
      toast({ title: "Crew member removed", description: "Crew member has been deleted." });
    },
  });

  const createTimeEntry = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/arborist/time-entries", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/arborist/time-entries"] });
      setTimeDialogOpen(false);
      resetTeForm();
      toast({ title: "Time entry added", description: "New time entry recorded." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add time entry.", variant: "destructive" });
    },
  });

  const approveTimeEntry = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/arborist/time-entries/${id}`, { status: "approved" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/arborist/time-entries"] });
      toast({ title: "Approved", description: "Time entry has been approved." });
    },
  });

  const resetCrewForm = () => {
    setFirstName(""); setLastName(""); setEmail(""); setPhone(""); setRole("climber"); setHourlyRate("");
  };
  const resetTeForm = () => {
    setTeCrew(""); setTeJob(""); setTeDate(""); setTeHours(""); setTeOvertime(""); setTeNotes("");
  };

  const handleCrewSubmit = () => {
    if (!firstName.trim() || !lastName.trim()) return;
    createCrew.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email || null,
      phone: phone || null,
      role,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
    });
  };

  const handleTeSubmit = () => {
    if (!teCrew || !teDate || !teHours) return;
    createTimeEntry.mutate({
      crewMemberId: parseInt(teCrew),
      jobId: teJob ? parseInt(teJob) : null,
      date: teDate,
      hoursWorked: parseFloat(teHours),
      overtimeHours: teOvertime ? parseFloat(teOvertime) : 0,
      notes: teNotes || null,
    });
  };

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
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <HardHat className="w-7 h-7" style={{ color: "#c2703e" }} />
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "#f1f5f9" }} data-testid="text-crew-title">Crew</h1>
          </div>
          <Dialog open={crewDialogOpen} onOpenChange={setCrewDialogOpen}>
            <DialogTrigger asChild>
              <Button style={{ background: "#c2703e", color: "#fff" }} className="gap-1.5" data-testid="button-add-crew">
                <Plus className="w-4 h-4" /> Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto" data-testid="dialog-add-crew">
              <DialogHeader><DialogTitle>Add Crew Member</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div><Label>First Name *</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" data-testid="input-crew-first-name" /></div>
                <div><Label>Last Name *</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" data-testid="input-crew-last-name" /></div>
                <div><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" type="email" data-testid="input-crew-email" /></div>
                <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" data-testid="input-crew-phone" /></div>
                <div>
                  <Label>Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger data-testid="select-crew-role"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1).replace("-", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Hourly Rate ($)</Label><Input type="number" step="0.01" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="0.00" data-testid="input-crew-rate" /></div>
                <div className="flex items-center gap-3 pt-2">
                  <Button style={{ background: "#c2703e", color: "#fff" }} className="gap-1.5" onClick={handleCrewSubmit} disabled={createCrew.isPending || !firstName.trim() || !lastName.trim()} data-testid="button-submit-crew">
                    {createCrew.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add Member
                  </Button>
                  <DialogClose asChild><Button variant="outline" data-testid="button-cancel-crew">Cancel</Button></DialogClose>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {crewList.length === 0 ? (
        <div className="text-center py-16">
          <HardHat className="w-12 h-12 mx-auto mb-4" style={{ color: "#64748b", opacity: 0.3 }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: "#f1f5f9" }}>No crew members yet</h3>
          <p className="text-sm" style={{ color: "#94a3b8" }}>Add your first crew member</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {crewList.map((member, i) => (
            <motion.div key={member.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="p-5 border-0" style={{ background: "rgba(255,255,255,0.04)" }} data-testid={`card-crew-${member.id}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: "#f1f5f9" }} data-testid={`text-crew-name-${member.id}`}>
                      {member.firstName} {member.lastName}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1).replace("-", " ") : "—"}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge
                      className="text-[10px] cursor-pointer"
                      style={{
                        background: member.isActive ? "rgba(16,185,129,0.15)" : "rgba(148,163,184,0.15)",
                        color: member.isActive ? "#10b981" : "#94a3b8",
                        border: "none",
                      }}
                      onClick={() => toggleActive.mutate({ id: member.id, isActive: !member.isActive })}
                      data-testid={`badge-crew-active-${member.id}`}
                    >
                      {member.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button size="icon" variant="ghost" onClick={() => deleteCrew.mutate(member.id)} disabled={deleteCrew.isPending} data-testid={`button-delete-crew-${member.id}`}>
                      <Trash2 className="w-4 h-4" style={{ color: "#64748b" }} />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs" style={{ color: "#94a3b8" }}>
                  {member.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 flex-shrink-0" /><span>{member.email}</span></div>}
                  {member.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 flex-shrink-0" /><span>{member.phone}</span></div>}
                  {member.hourlyRate != null && (
                    <div className="flex items-center gap-2"><DollarSign className="w-3.5 h-3.5 flex-shrink-0" /><span>${Number(member.hourlyRate).toFixed(2)}/hr</span></div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <div className="border-t pt-8" style={{ borderColor: "rgba(194,112,62,0.15)" }}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6" style={{ color: "#c2703e" }} />
            <h2 className="text-xl font-bold" style={{ color: "#f1f5f9" }} data-testid="text-time-entries-title">Time Entries</h2>
          </div>
          <Dialog open={timeDialogOpen} onOpenChange={setTimeDialogOpen}>
            <DialogTrigger asChild>
              <Button style={{ background: "#c2703e", color: "#fff" }} className="gap-1.5" data-testid="button-add-time-entry">
                <Plus className="w-4 h-4" /> Log Time
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto" data-testid="dialog-add-time-entry">
              <DialogHeader><DialogTitle>Log Time Entry</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>Crew Member *</Label>
                  <Select value={teCrew} onValueChange={setTeCrew}>
                    <SelectTrigger data-testid="select-te-crew"><SelectValue placeholder="Select crew member" /></SelectTrigger>
                    <SelectContent>{crewList.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.firstName} {c.lastName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Job</Label>
                  <Select value={teJob} onValueChange={setTeJob}>
                    <SelectTrigger data-testid="select-te-job"><SelectValue placeholder="Select job" /></SelectTrigger>
                    <SelectContent>{jobsList.map((j) => <SelectItem key={j.id} value={String(j.id)}>{j.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Date *</Label><Input type="date" value={teDate} onChange={(e) => setTeDate(e.target.value)} data-testid="input-te-date" /></div>
                <div><Label>Hours Worked *</Label><Input type="number" step="0.25" value={teHours} onChange={(e) => setTeHours(e.target.value)} placeholder="8" data-testid="input-te-hours" /></div>
                <div><Label>Overtime Hours</Label><Input type="number" step="0.25" value={teOvertime} onChange={(e) => setTeOvertime(e.target.value)} placeholder="0" data-testid="input-te-overtime" /></div>
                <div><Label>Notes</Label><Textarea value={teNotes} onChange={(e) => setTeNotes(e.target.value)} placeholder="Notes..." data-testid="input-te-notes" /></div>
                <div className="flex items-center gap-3 pt-2">
                  <Button style={{ background: "#c2703e", color: "#fff" }} className="gap-1.5" onClick={handleTeSubmit} disabled={createTimeEntry.isPending || !teCrew || !teDate || !teHours} data-testid="button-submit-time-entry">
                    {createTimeEntry.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Log Time
                  </Button>
                  <DialogClose asChild><Button variant="outline" data-testid="button-cancel-time-entry">Cancel</Button></DialogClose>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {teList.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm" style={{ color: "#64748b" }}>No time entries yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {teList.slice(0, 20).map((te) => {
              const isPending = te.status === "pending";
              return (
                <Card key={te.id} className="p-4 border-0 flex flex-wrap items-center justify-between gap-3" style={{ background: "rgba(255,255,255,0.04)" }} data-testid={`card-te-${te.id}`}>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#e2e8f0" }}>{getCrewName(te.crewMemberId)}</p>
                      <p className="text-xs" style={{ color: "#64748b" }}>{getJobTitle(te.jobId)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs" style={{ color: "#94a3b8" }}>{te.date}</span>
                    <span className="text-xs font-medium" style={{ color: "#e2e8f0" }}>{te.hoursWorked}h{te.overtimeHours ? ` +${te.overtimeHours}ot` : ""}</span>
                    <Badge className="text-[10px]" style={{
                      background: isPending ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)",
                      color: isPending ? "#f59e0b" : "#10b981",
                      border: "none",
                    }} data-testid={`badge-te-status-${te.id}`}>{te.status}</Badge>
                    {isPending && (
                      <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => approveTimeEntry.mutate(te.id)} disabled={approveTimeEntry.isPending} data-testid={`button-approve-te-${te.id}`}>
                        <CheckCircle className="w-3 h-3" /> Approve
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
