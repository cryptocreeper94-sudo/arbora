import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Calculator, Plus, Trash2, Loader2, DollarSign, TreePine, MapPin, X
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
import type { ArboristEstimate, ArboristClient } from "@shared/schema";

const statusStyles: Record<string, { bg: string; text: string }> = {
  draft: { bg: "rgba(148,163,184,0.15)", text: "#94a3b8" },
  sent: { bg: "rgba(245,158,11,0.15)", text: "#f59e0b" },
  accepted: { bg: "rgba(16,185,129,0.15)", text: "#10b981" },
  declined: { bg: "rgba(239,68,68,0.15)", text: "#ef4444" },
};

const serviceTypes = ["removal", "trimming", "stump-grinding", "consultation", "planting", "emergency"];

export default function ArboraEstimates() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [notes, setNotes] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [treeSpecies, setTreeSpecies] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [items, setItems] = useState<{ description: string; quantity: string; unitPrice: string }[]>([
    { description: "", quantity: "1", unitPrice: "" },
  ]);

  const { data: estimates, isLoading } = useQuery<ArboristEstimate[]>({ queryKey: ["/api/arborist/estimates"] });
  const { data: clients } = useQuery<ArboristClient[]>({ queryKey: ["/api/arborist/clients"] });
  const list = estimates || [];
  const clientsList = clients || [];

  const getClientName = (cId: number | null) => cId ? clientsList.find((c) => c.id === cId)?.name || "Unknown" : "—";

  const subtotal = items.reduce((s, it) => s + (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0), 0);
  const taxAmount = subtotal * (parseFloat(taxRate) || 0) / 100;
  const total = subtotal + taxAmount;

  const createEstimate = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/arborist/estimates", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/arborist/estimates"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Estimate created", description: "New estimate has been generated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create estimate.", variant: "destructive" });
    },
  });

  const updateEstimate = useMutation({
    mutationFn: async ({ id, ...data }: Record<string, unknown>) => {
      const res = await apiRequest("PATCH", `/api/arborist/estimates/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/arborist/estimates"] });
      toast({ title: "Estimate updated", description: "Status changed." });
    },
  });

  const deleteEstimate = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/arborist/estimates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/arborist/estimates"] });
      toast({ title: "Estimate removed", description: "Estimate has been deleted." });
    },
  });

  const resetForm = () => {
    setClientId(""); setTaxRate("0"); setNotes(""); setSiteAddress("");
    setTreeSpecies(""); setServiceType(""); setValidUntil("");
    setItems([{ description: "", quantity: "1", unitPrice: "" }]);
  };

  const addItem = () => setItems([...items, { description: "", quantity: "1", unitPrice: "" }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, val: string) => {
    const updated = [...items];
    (updated[idx] as any)[field] = val;
    setItems(updated);
  };

  const handleSubmit = () => {
    const validItems = items.filter((it) => it.description.trim());
    if (validItems.length === 0) return;
    createEstimate.mutate({
      clientId: clientId ? parseInt(clientId) : null,
      taxRate: parseFloat(taxRate) || 0,
      notes: notes || null,
      siteAddress: siteAddress || null,
      treeSpecies: treeSpecies || null,
      serviceType: serviceType || null,
      validUntil: validUntil || null,
      items: validItems.map((it) => ({
        description: it.description.trim(),
        quantity: parseFloat(it.quantity) || 1,
        unitPrice: parseFloat(it.unitPrice) || 0,
      })),
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
            <Calculator className="w-7 h-7" style={{ color: "#c2703e" }} />
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "#f1f5f9" }} data-testid="text-estimates-title">Estimates</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button style={{ background: "#c2703e", color: "#fff" }} className="gap-1.5" data-testid="button-add-estimate">
                <Plus className="w-4 h-4" /> New Estimate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto max-w-lg" data-testid="dialog-add-estimate">
              <DialogHeader><DialogTitle>Create Estimate</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>Client</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger data-testid="select-estimate-client"><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>{clientsList.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Service Type</Label>
                  <Select value={serviceType} onValueChange={setServiceType}>
                    <SelectTrigger data-testid="select-estimate-service"><SelectValue placeholder="Select service" /></SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map((st) => <SelectItem key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1).replace("-", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Tree Species</Label><Input value={treeSpecies} onChange={(e) => setTreeSpecies(e.target.value)} placeholder="e.g., Red Oak, Sugar Maple" data-testid="input-estimate-species" /></div>
                <div><Label>Site Address</Label><Input value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} placeholder="Job site address" data-testid="input-estimate-site" /></div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Line Items</Label>
                    <Button variant="outline" size="sm" onClick={addItem} className="gap-1 text-xs" data-testid="button-add-estimate-item"><Plus className="w-3 h-3" /> Add Row</Button>
                  </div>
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-2">
                      <Input className="flex-1" placeholder="Description" value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} data-testid={`input-est-item-desc-${idx}`} />
                      <Input className="w-16" placeholder="Qty" type="number" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} data-testid={`input-est-item-qty-${idx}`} />
                      <Input className="w-24" placeholder="Price" type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", e.target.value)} data-testid={`input-est-item-price-${idx}`} />
                      {items.length > 1 && (
                        <Button size="icon" variant="ghost" onClick={() => removeItem(idx)} data-testid={`button-remove-est-item-${idx}`}><X className="w-3.5 h-3.5" style={{ color: "#64748b" }} /></Button>
                      )}
                    </div>
                  ))}
                </div>
                <div><Label>Tax Rate (%)</Label><Input type="number" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} data-testid="input-estimate-tax" /></div>
                <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="flex justify-between text-xs mb-1" style={{ color: "#94a3b8" }}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-xs mb-1" style={{ color: "#94a3b8" }}><span>Tax</span><span>${taxAmount.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm font-semibold" style={{ color: "#f1f5f9" }}><span>Total</span><span data-testid="text-estimate-total">${total.toFixed(2)}</span></div>
                </div>
                <div><Label>Valid Until</Label><Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} data-testid="input-estimate-valid" /></div>
                <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..." data-testid="input-estimate-notes" /></div>
                <div className="flex items-center gap-3 pt-2">
                  <Button style={{ background: "#c2703e", color: "#fff" }} className="gap-1.5" onClick={handleSubmit} disabled={createEstimate.isPending} data-testid="button-submit-estimate">
                    {createEstimate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Create Estimate
                  </Button>
                  <DialogClose asChild><Button variant="outline" data-testid="button-cancel-estimate">Cancel</Button></DialogClose>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {list.length === 0 ? (
        <div className="text-center py-20">
          <Calculator className="w-12 h-12 mx-auto mb-4" style={{ color: "#64748b", opacity: 0.3 }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: "#f1f5f9" }}>No estimates yet</h3>
          <p className="text-sm" style={{ color: "#94a3b8" }}>Create your first estimate</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((est, i) => {
            const ss = statusStyles[est.status || "draft"] || statusStyles.draft;
            return (
              <motion.div key={est.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="p-5 border-0" style={{ background: "rgba(255,255,255,0.04)" }} data-testid={`card-estimate-${est.id}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold" style={{ color: "#f1f5f9" }} data-testid={`text-estimate-number-${est.id}`}>{est.estimateNumber}</h3>
                      <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{getClientName(est.clientId)}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => deleteEstimate.mutate(est.id)} disabled={deleteEstimate.isPending} data-testid={`button-delete-estimate-${est.id}`}>
                      <Trash2 className="w-4 h-4" style={{ color: "#64748b" }} />
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Select value={est.status || "draft"} onValueChange={(newStatus) => updateEstimate.mutate({ id: est.id, status: newStatus })}>
                      <SelectTrigger className="h-7 w-auto gap-1 border-0 text-xs" style={{ background: ss.bg, color: ss.text }} data-testid={`select-estimate-status-${est.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 text-xs" style={{ color: "#94a3b8" }}>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="font-semibold" style={{ color: "#f1f5f9" }} data-testid={`text-estimate-total-${est.id}`}>${Number(est.total || 0).toFixed(2)}</span>
                    </div>
                    {est.serviceType && (
                      <div className="flex items-center gap-2">
                        <TreePine className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{est.serviceType.charAt(0).toUpperCase() + est.serviceType.slice(1).replace("-", " ")}</span>
                      </div>
                    )}
                    {est.treeSpecies && (
                      <div className="flex items-center gap-2">
                        <TreePine className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#10b981" }} />
                        <span>{est.treeSpecies}</span>
                      </div>
                    )}
                    {est.siteAddress && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{est.siteAddress}</span>
                      </div>
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
