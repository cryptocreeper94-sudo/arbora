import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Wrench, Plus, Loader2, AlertTriangle, Clock, Cog, Fuel, ChevronRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";

interface GarageBotEquipment {
  id: string;
  vin: string | null;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  vehicleType: string;
  engineType: string | null;
  engineSize: string | null;
  fuelType: string | null;
  transmission: string | null;
  drivetrain: string | null;
  bodyStyle: string | null;
  currentMileage: number | null;
  isPrimary: boolean;
  imageUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MaintenanceAlert {
  id: string;
  vehicleId: string;
  taskName: string;
  nextDueDate: string | null;
  nextDueMileage: number | null;
  priority: string;
}

export default function ArboraEquipment() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [newYear, setNewYear] = useState("");
  const [newMake, setNewMake] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newType, setNewType] = useState("equipment");
  const [newEngine, setNewEngine] = useState("");
  const [newEngineSize, setNewEngineSize] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const { data: equipmentData, isLoading } = useQuery<{ success: boolean; equipment: GarageBotEquipment[] }>({
    queryKey: ["/api/garagebot/equipment"],
  });
  const equipment = equipmentData?.equipment || [];

  const { data: alertsData } = useQuery<{ success: boolean; alerts: { overdueCount: number; upcomingCount: number; overdue: MaintenanceAlert[]; upcoming: MaintenanceAlert[] } }>({
    queryKey: ["/api/garagebot/maintenance-alerts"],
  });
  const alerts = alertsData?.alerts;

  const { data: detailData } = useQuery<{ success: boolean; equipment: GarageBotEquipment; serviceHistory: any[]; maintenanceSchedule: any[]; reminders: any[] }>({
    queryKey: ["/api/garagebot/equipment", selectedEquipment],
    enabled: !!selectedEquipment,
  });

  const createEquipment = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/garagebot/equipment", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/garagebot/equipment"] });
      setDialogOpen(false);
      setNewYear(""); setNewMake(""); setNewModel(""); setNewType("equipment");
      setNewEngine(""); setNewEngineSize(""); setNewNotes("");
      toast({ title: "Equipment added", description: "Registered in GarageBot successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add equipment to GarageBot.", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!newYear || !newMake.trim() || !newModel.trim()) return;
    createEquipment.mutate({
      year: parseInt(newYear), make: newMake.trim(), model: newModel.trim(),
      vehicleType: newType, engineType: newEngine || undefined,
      engineSize: newEngineSize || undefined, notes: newNotes || undefined,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-6 md:py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "#f1f5f9" }} data-testid="text-equipment-title">Equipment</h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            {equipment.length} piece{equipment.length !== 1 ? "s" : ""} tracked via GarageBot
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5" style={{ background: "#c2703e", color: "#fff" }} data-testid="button-add-equipment">
              <Plus className="w-4 h-4" /> Add Equipment
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-add-equipment">
            <DialogHeader>
              <DialogTitle>Register Equipment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Year *</Label><Input type="number" value={newYear} onChange={(e) => setNewYear(e.target.value)} placeholder="2024" data-testid="input-equipment-year" /></div>
                <div>
                  <Label>Type</Label>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger data-testid="select-equipment-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="truck">Truck</SelectItem>
                      <SelectItem value="motorcycle">Motorcycle</SelectItem>
                      <SelectItem value="atv">ATV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Make *</Label><Input value={newMake} onChange={(e) => setNewMake(e.target.value)} placeholder="Stihl, Honda..." data-testid="input-equipment-make" /></div>
              <div><Label>Model *</Label><Input value={newModel} onChange={(e) => setNewModel(e.target.value)} placeholder="MS 500i, CRF450R..." data-testid="input-equipment-model" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Engine Type</Label><Input value={newEngine} onChange={(e) => setNewEngine(e.target.value)} placeholder="2-stroke, v8..." data-testid="input-equipment-engine" /></div>
                <div><Label>Engine Size</Label><Input value={newEngineSize} onChange={(e) => setNewEngineSize(e.target.value)} placeholder="79.2cc, 5.0L..." data-testid="input-equipment-engine-size" /></div>
              </div>
              <div><Label>Notes</Label><Textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Usage notes..." data-testid="input-equipment-notes" /></div>
              <div className="flex items-center gap-3 pt-2">
                <Button style={{ background: "#c2703e", color: "#fff" }} onClick={handleSubmit} disabled={createEquipment.isPending || !newYear || !newMake.trim() || !newModel.trim()} data-testid="button-submit-equipment">
                  {createEquipment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Register
                </Button>
                <DialogClose asChild><Button variant="outline" data-testid="button-cancel-equipment">Cancel</Button></DialogClose>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {alerts && (alerts.overdueCount > 0 || alerts.upcomingCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {alerts.overdueCount > 0 && (
            <Card className="p-4 border-0" style={{ background: "rgba(239,68,68,0.08)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.15)" }}>
                  <AlertTriangle className="w-5 h-5" style={{ color: "#ef4444" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#ef4444" }} data-testid="text-overdue-count">{alerts.overdueCount} Overdue</p>
                  <p className="text-xs" style={{ color: "#64748b" }}>Maintenance items past due</p>
                </div>
              </div>
              {alerts.overdue.slice(0, 3).map((a) => (
                <div key={a.id} className="mt-2 text-xs flex items-center gap-2" style={{ color: "#ef4444" }}>
                  <Clock className="w-3 h-3" /> {a.taskName}
                  {a.nextDueDate && <span style={{ color: "#64748b" }}>{"\u2014"} {new Date(a.nextDueDate).toLocaleDateString()}</span>}
                </div>
              ))}
            </Card>
          )}
          {alerts.upcomingCount > 0 && (
            <Card className="p-4 border-0" style={{ background: "rgba(245,158,11,0.08)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.15)" }}>
                  <Clock className="w-5 h-5" style={{ color: "#f59e0b" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#f59e0b" }} data-testid="text-upcoming-count">{alerts.upcomingCount} Upcoming</p>
                  <p className="text-xs" style={{ color: "#64748b" }}>Due within 30 days</p>
                </div>
              </div>
              {alerts.upcoming.slice(0, 3).map((a) => (
                <div key={a.id} className="mt-2 text-xs flex items-center gap-2" style={{ color: "#f59e0b" }}>
                  <Clock className="w-3 h-3" /> {a.taskName}
                  {a.nextDueDate && <span style={{ color: "#64748b" }}>{"\u2014"} {new Date(a.nextDueDate).toLocaleDateString()}</span>}
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#c2703e" }} />
        </div>
      ) : equipment.length === 0 ? (
        <div className="text-center py-20">
          <Wrench className="w-12 h-12 mx-auto mb-4" style={{ color: "#334155" }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: "#f1f5f9" }}>No equipment tracked</h3>
          <p className="text-sm" style={{ color: "#64748b" }}>Register your chainsaws, vehicles, and power equipment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipment.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card
                className="p-4 cursor-pointer border-0 transition-colors"
                style={{ background: "rgba(255,255,255,0.04)" }}
                onClick={() => setSelectedEquipment(selectedEquipment === item.id ? null : item.id)}
                data-testid={`card-equipment-${item.id}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(194,112,62,0.12)" }}>
                      <Wrench className="w-4 h-4" style={{ color: "#c2703e" }} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm" style={{ color: "#f1f5f9" }} data-testid={`text-equipment-name-${item.id}`}>
                        {item.year} {item.make} {item.model}
                      </h4>
                      <p className="text-xs capitalize" style={{ color: "#64748b" }}>{item.vehicleType}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedEquipment === item.id ? "rotate-90" : ""}`} style={{ color: "#64748b" }} />
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {item.engineType && (
                    <Badge className="gap-1 border-0" style={{ background: "rgba(194,112,62,0.1)", color: "#c2703e" }}>
                      <Cog className="w-3 h-3" /> {item.engineType}
                    </Badge>
                  )}
                  {item.engineSize && <Badge className="border-0" style={{ background: "rgba(148,163,184,0.1)", color: "#94a3b8" }}>{item.engineSize}</Badge>}
                  {item.fuelType && (
                    <Badge className="gap-1 border-0" style={{ background: "rgba(148,163,184,0.1)", color: "#94a3b8" }}>
                      <Fuel className="w-3 h-3" /> {item.fuelType}
                    </Badge>
                  )}
                  {item.currentMileage != null && <Badge className="border-0" style={{ background: "rgba(148,163,184,0.1)", color: "#94a3b8" }}>{item.currentMileage.toLocaleString()} mi/hrs</Badge>}
                </div>
                {item.notes && <p className="text-xs mt-2 line-clamp-2" style={{ color: "#64748b" }}>{item.notes}</p>}

                <AnimatePresence>
                  {selectedEquipment === item.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="mt-3 pt-3 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        {(!detailData || detailData.equipment?.id !== item.id) ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#c2703e" }} />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {detailData.maintenanceSchedule.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold mb-1.5" style={{ color: "#f1f5f9" }}>Maintenance Schedule</p>
                                {detailData.maintenanceSchedule.map((m: any) => (
                                  <div key={m.id} className="flex items-center justify-between text-xs py-1">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-1.5 h-1.5 rounded-full`} style={{ background: m.status === "overdue" ? "#ef4444" : m.status === "upcoming" ? "#f59e0b" : "#10b981" }} />
                                      <span style={{ color: "#94a3b8" }}>{m.taskName}</span>
                                    </div>
                                    {m.nextDueDate && <span style={{ color: "#64748b" }}>{new Date(m.nextDueDate).toLocaleDateString()}</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                            {detailData.serviceHistory.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold mb-1.5" style={{ color: "#f1f5f9" }}>Recent Service</p>
                                {detailData.serviceHistory.slice(0, 3).map((s: any) => (
                                  <div key={s.id} className="flex items-center justify-between text-xs py-1">
                                    <span style={{ color: "#94a3b8" }}>{s.serviceType}</span>
                                    <div className="flex items-center gap-2">
                                      {s.totalCost && <span style={{ color: "#c2703e" }}>${s.totalCost}</span>}
                                      <span style={{ color: "#64748b" }}>{new Date(s.serviceDate).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
