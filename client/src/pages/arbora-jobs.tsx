import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  TreePine, Plus, Trash2, Loader2, Calendar, DollarSign, Users
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ArboristJob, ArboristClient } from "@shared/schema";

const statusColors: Record<string, { bg: string; text: string }> = {
  scheduled: { bg: "rgba(245,158,11,0.15)", text: "#f59e0b" },
  "in-progress": { bg: "rgba(16,185,129,0.15)", text: "#10b981" },
  completed: { bg: "rgba(148,163,184,0.15)", text: "#94a3b8" },
};

export default function ArboraJobs() {
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [crew, setCrew] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("scheduled");

  const { data: jobs, isLoading } = useQuery<ArboristJob[]>({ queryKey: ["/api/arborist/jobs"] });
  const { data: clients } = useQuery<ArboristClient[]>({ queryKey: ["/api/arborist/clients"] });
  const jobsList = jobs || [];
  const clientsList = clients || [];

  const filtered = filter === "all" ? jobsList : jobsList.filter((j) => j.status === filter);
  const getClientName = (cId: number | null) => cId ? clientsList.find((c) => c.id === cId)?.name || null : null;

  const createJob = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/arborist/jobs", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/arborist/jobs"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Job created", description: "New job has been added." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create job.", variant: "destructive" });
    },
  });

  const updateJob = useMutation({
    mutationFn: async ({ id, ...data }: Record<string, unknown>) => {
      const res = await apiRequest("PATCH", `/api/arborist/jobs/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/arborist/jobs"] });
      toast({ title: "Job updated", description: "Status changed." });
    },
  });

  const deleteJob = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/arborist/jobs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/arborist/jobs"] });
      toast({ title: "Job removed", description: "Job has been deleted." });
    },
  });

  const resetForm = () => {
    setTitle(""); setClientId(""); setDescription(""); setScheduledDate("");
    setEstimatedCost(""); setCrew(""); setNotes(""); setStatus("scheduled");
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    createJob.mutate({
      title: title.trim(),
      clientId: clientId ? parseInt(clientId) : null,
      description: description || null,
      scheduledDate: scheduledDate || null,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
      crew: crew ? crew.split(",").map((c) => c.trim()).filter(Boolean) : [],
      notes: notes || null,
      status,
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
            <TreePine className="w-7 h-7" style={{ color: "#c2703e" }} />
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "#f1f5f9" }} data-testid="text-jobs-title">Jobs</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button style={{ background: "#c2703e", color: "#fff" }} className="gap-1.5" data-testid="button-add-job">
                <Plus className="w-4 h-4" /> Add Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto" data-testid="dialog-add-job">
              <DialogHeader><DialogTitle>Add New Job</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Job title" data-testid="input-job-title" /></div>
                <div>
                  <Label>Client</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger data-testid="select-job-client"><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>{clientsList.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Job description..." data-testid="input-job-description" /></div>
                <div><Label>Scheduled Date</Label><Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} data-testid="input-job-date" /></div>
                <div><Label>Estimated Cost ($)</Label><Input type="number" step="0.01" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} placeholder="0.00" data-testid="input-job-cost" /></div>
                <div><Label>Crew (comma-separated)</Label><Input value={crew} onChange={(e) => setCrew(e.target.value)} placeholder="John, Jane" data-testid="input-job-crew" /></div>
                <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..." data-testid="input-job-notes" /></div>
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger data-testid="select-job-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button style={{ background: "#c2703e", color: "#fff" }} className="gap-1.5" onClick={handleSubmit} disabled={createJob.isPending || !title.trim()} data-testid="button-submit-job">
                    {createJob.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add Job
                  </Button>
                  <DialogClose asChild><Button variant="outline" data-testid="button-cancel-job">Cancel</Button></DialogClose>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList style={{ background: "rgba(255,255,255,0.06)" }}>
          <TabsTrigger value="all" data-testid="filter-all">All ({jobsList.length})</TabsTrigger>
          <TabsTrigger value="scheduled" data-testid="filter-scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="in-progress" data-testid="filter-in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed" data-testid="filter-completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <TreePine className="w-12 h-12 mx-auto mb-4" style={{ color: "#64748b", opacity: 0.3 }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: "#f1f5f9" }}>No jobs found</h3>
          <p className="text-sm" style={{ color: "#94a3b8" }}>Create your first job to start tracking work</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((job, i) => {
            const sc = statusColors[job.status || "scheduled"] || statusColors.scheduled;
            return (
              <motion.div key={job.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="p-5 border-0" style={{ background: "rgba(255,255,255,0.04)" }} data-testid={`card-job-${job.id}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate" style={{ color: "#f1f5f9" }} data-testid={`text-job-title-${job.id}`}>{job.title}</h3>
                      {getClientName(job.clientId) && <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{getClientName(job.clientId)}</p>}
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => deleteJob.mutate(job.id)} disabled={deleteJob.isPending} data-testid={`button-delete-job-${job.id}`}>
                      <Trash2 className="w-4 h-4" style={{ color: "#64748b" }} />
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Select value={job.status || "scheduled"} onValueChange={(newStatus) => updateJob.mutate({ id: job.id, status: newStatus })}>
                      <SelectTrigger className="h-7 w-auto gap-1 border-0 text-xs" style={{ background: sc.bg, color: sc.text }} data-testid={`select-job-status-${job.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 text-xs" style={{ color: "#94a3b8" }}>
                    {job.scheduledDate && (
                      <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 flex-shrink-0" /><span data-testid={`text-job-date-${job.id}`}>{job.scheduledDate}</span></div>
                    )}
                    {job.estimatedCost != null && (
                      <div className="flex items-center gap-2"><DollarSign className="w-3.5 h-3.5 flex-shrink-0" /><span data-testid={`text-job-cost-${job.id}`}>${Number(job.estimatedCost).toFixed(2)}</span></div>
                    )}
                    {job.crew && job.crew.length > 0 && (
                      <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 flex-shrink-0" /><span>{job.crew.join(", ")}</span></div>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
