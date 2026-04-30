import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Briefcase, Plus, Trash2, Loader2, DollarSign, Calendar, TrendingUp
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
import type { ArboristDeal, ArboristClient } from "@shared/schema";

const stages = ["new", "contacted", "qualified", "proposal-sent", "won", "lost"] as const;
const stageLabels: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  "proposal-sent": "Proposal Sent",
  won: "Won",
  lost: "Lost",
};
const stageColors: Record<string, string> = {
  new: "#94a3b8",
  contacted: "#c2703e",
  qualified: "#f59e0b",
  "proposal-sent": "#3b82f6",
  won: "#10b981",
  lost: "#ef4444",
};

export default function ArboraDeals() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [value, setValue] = useState("");
  const [stage, setStage] = useState("new");
  const [description, setDescription] = useState("");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");

  const { data: deals, isLoading } = useQuery<ArboristDeal[]>({ queryKey: ["/api/arborist/deals"] });
  const { data: clients } = useQuery<ArboristClient[]>({ queryKey: ["/api/arborist/clients"] });
  const dealsList = deals || [];
  const clientsList = clients || [];

  const totalValue = dealsList.reduce((s, d) => s + (d.value || 0), 0);
  const getClientName = (cId: number | null) => cId ? clientsList.find((c) => c.id === cId)?.name || "Unknown" : "—";

  const createDeal = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/arborist/deals", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/arborist/deals"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Deal created", description: "New deal added to pipeline." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create deal.", variant: "destructive" });
    },
  });

  const updateDeal = useMutation({
    mutationFn: async ({ id, ...data }: Record<string, unknown>) => {
      const res = await apiRequest("PATCH", `/api/arborist/deals/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/arborist/deals"] });
      toast({ title: "Deal updated", description: "Stage changed." });
    },
  });

  const deleteDeal = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/arborist/deals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/arborist/deals"] });
      toast({ title: "Deal removed", description: "Deal has been deleted." });
    },
  });

  const resetForm = () => {
    setTitle("");
    setClientId("");
    setValue("");
    setStage("new");
    setDescription("");
    setExpectedCloseDate("");
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    createDeal.mutate({
      title: title.trim(),
      clientId: clientId ? parseInt(clientId) : null,
      value: value ? parseFloat(value) : 0,
      stage,
      description: description || null,
      expectedCloseDate: expectedCloseDate || null,
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
            <Briefcase className="w-7 h-7" style={{ color: "#c2703e" }} />
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "#f1f5f9" }} data-testid="text-deals-title">
              Deal Pipeline
            </h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button style={{ background: "#c2703e", color: "#fff" }} className="gap-1.5" data-testid="button-add-deal">
                <Plus className="w-4 h-4" /> Add Deal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto" data-testid="dialog-add-deal">
              <DialogHeader>
                <DialogTitle>Add New Deal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>Title *</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Deal title" data-testid="input-deal-title" />
                </div>
                <div>
                  <Label>Client</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger data-testid="select-deal-client"><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>
                      {clientsList.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Value ($)</Label>
                  <Input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0.00" data-testid="input-deal-value" />
                </div>
                <div>
                  <Label>Stage</Label>
                  <Select value={stage} onValueChange={setStage}>
                    <SelectTrigger data-testid="select-deal-stage"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {stages.map((s) => (
                        <SelectItem key={s} value={s}>{stageLabels[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deal description..." data-testid="input-deal-description" />
                </div>
                <div>
                  <Label>Expected Close Date</Label>
                  <Input type="date" value={expectedCloseDate} onChange={(e) => setExpectedCloseDate(e.target.value)} data-testid="input-deal-close-date" />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button style={{ background: "#c2703e", color: "#fff" }} className="gap-1.5" onClick={handleSubmit} disabled={createDeal.isPending || !title.trim()} data-testid="button-submit-deal">
                    {createDeal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add Deal
                  </Button>
                  <DialogClose asChild>
                    <Button variant="outline" data-testid="button-cancel-deal">Cancel</Button>
                  </DialogClose>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: "#c2703e" }} />
            <span className="text-sm font-medium" style={{ color: "#e2e8f0" }} data-testid="text-total-deals">{dealsList.length} deals</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" style={{ color: "#10b981" }} />
            <span className="text-sm font-medium" style={{ color: "#e2e8f0" }} data-testid="text-total-value">${totalValue.toLocaleString()}</span>
          </div>
        </div>
      </motion.div>

      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 400 }}>
        {stages.map((stg) => {
          const stageDeals = dealsList.filter((d) => d.stage === stg);
          const color = stageColors[stg];
          return (
            <div key={stg} className="flex-shrink-0" style={{ width: 280 }}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>{stageLabels[stg]}</span>
                <Badge className="text-[10px] ml-auto" style={{ background: `${color}20`, color, border: "none" }}>{stageDeals.length}</Badge>
              </div>
              <div className="space-y-3">
                {stageDeals.map((deal) => (
                  <motion.div key={deal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="p-4 border-0" style={{ background: "rgba(255,255,255,0.04)" }} data-testid={`card-deal-${deal.id}`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-semibold truncate" style={{ color: "#f1f5f9" }} data-testid={`text-deal-title-${deal.id}`}>{deal.title}</h4>
                        <Button size="icon" variant="ghost" onClick={() => deleteDeal.mutate(deal.id)} disabled={deleteDeal.isPending} data-testid={`button-delete-deal-${deal.id}`}>
                          <Trash2 className="w-3.5 h-3.5" style={{ color: "#64748b" }} />
                        </Button>
                      </div>
                      <p className="text-xs mb-2" style={{ color: "#94a3b8" }} data-testid={`text-deal-client-${deal.id}`}>{getClientName(deal.clientId)}</p>
                      {deal.value != null && deal.value > 0 && (
                        <div className="flex items-center gap-1 text-xs mb-1" style={{ color: "#10b981" }}>
                          <DollarSign className="w-3 h-3" />
                          <span data-testid={`text-deal-value-${deal.id}`}>${Number(deal.value).toLocaleString()}</span>
                        </div>
                      )}
                      {deal.expectedCloseDate && (
                        <div className="flex items-center gap-1 text-xs" style={{ color: "#64748b" }}>
                          <Calendar className="w-3 h-3" />
                          <span data-testid={`text-deal-date-${deal.id}`}>{deal.expectedCloseDate}</span>
                        </div>
                      )}
                      <div className="mt-3">
                        <Select value={deal.stage || "new"} onValueChange={(newStage) => updateDeal.mutate({ id: deal.id, stage: newStage })}>
                          <SelectTrigger className="h-7 text-xs border-0" style={{ background: "rgba(255,255,255,0.06)", color: "#e2e8f0" }} data-testid={`select-deal-stage-${deal.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {stages.map((s) => (
                              <SelectItem key={s} value={s}>{stageLabels[s]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </Card>
                  </motion.div>
                ))}
                {stageDeals.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-xs" style={{ color: "#64748b" }}>No deals</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
