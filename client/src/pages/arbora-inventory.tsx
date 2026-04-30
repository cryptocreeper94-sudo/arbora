import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Package, Plus, Trash2, Loader2, AlertTriangle, Edit2
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
import type { ArboristInventoryItem } from "@shared/schema";

const categories = ["supplies", "safety-gear", "rigging", "cutting", "vehicle", "fuel"];

export default function ArboraInventory() {
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ArboristInventoryItem | null>(null);
  const [editQty, setEditQty] = useState("");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("supplies");
  const [sku, setSku] = useState("");
  const [currentQuantity, setCurrentQuantity] = useState("");
  const [unit, setUnit] = useState("each");
  const [reorderPoint, setReorderPoint] = useState("5");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");

  const { data: inventory, isLoading } = useQuery<ArboristInventoryItem[]>({ queryKey: ["/api/arborist/inventory"] });
  const { data: lowStock } = useQuery<ArboristInventoryItem[]>({ queryKey: ["/api/arborist/inventory/low-stock"] });
  const list = inventory || [];
  const lowStockList = lowStock || [];

  const filtered = filter === "all" ? list : list.filter((it) => it.category === filter);

  const createItem = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/arborist/inventory", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/arborist/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/arborist/inventory/low-stock"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Item added", description: "New inventory item created." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add item.", variant: "destructive" });
    },
  });

  const updateQuantity = useMutation({
    mutationFn: async ({ id, currentQuantity }: { id: number; currentQuantity: number }) => {
      const res = await apiRequest("PATCH", `/api/arborist/inventory/${id}`, { currentQuantity });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/arborist/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/arborist/inventory/low-stock"] });
      setEditDialogOpen(false);
      setEditItem(null);
      toast({ title: "Quantity updated", description: "Inventory updated." });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/arborist/inventory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/arborist/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/arborist/inventory/low-stock"] });
      toast({ title: "Item removed", description: "Inventory item has been deleted." });
    },
  });

  const resetForm = () => {
    setName(""); setCategory("supplies"); setSku(""); setCurrentQuantity("");
    setUnit("each"); setReorderPoint("5"); setCostPerUnit(""); setSupplier(""); setNotes("");
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    createItem.mutate({
      name: name.trim(),
      category,
      sku: sku || null,
      currentQuantity: currentQuantity ? parseInt(currentQuantity) : 0,
      unit: unit || "each",
      reorderPoint: reorderPoint ? parseInt(reorderPoint) : 5,
      costPerUnit: costPerUnit ? parseFloat(costPerUnit) : null,
      supplier: supplier || null,
      notes: notes || null,
    });
  };

  const openEditQty = (item: ArboristInventoryItem) => {
    setEditItem(item);
    setEditQty(String(item.currentQuantity || 0));
    setEditDialogOpen(true);
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
            <Package className="w-7 h-7" style={{ color: "#c2703e" }} />
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "#f1f5f9" }} data-testid="text-inventory-title">Inventory</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button style={{ background: "#c2703e", color: "#fff" }} className="gap-1.5" data-testid="button-add-inventory">
                <Plus className="w-4 h-4" /> Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto" data-testid="dialog-add-inventory">
              <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name" data-testid="input-inv-name" /></div>
                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger data-testid="select-inv-category"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1).replace("-", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>SKU</Label><Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU-001" data-testid="input-inv-sku" /></div>
                <div><Label>Current Quantity</Label><Input type="number" value={currentQuantity} onChange={(e) => setCurrentQuantity(e.target.value)} placeholder="0" data-testid="input-inv-quantity" /></div>
                <div><Label>Unit</Label><Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="each" data-testid="input-inv-unit" /></div>
                <div><Label>Reorder Point</Label><Input type="number" value={reorderPoint} onChange={(e) => setReorderPoint(e.target.value)} placeholder="5" data-testid="input-inv-reorder" /></div>
                <div><Label>Cost Per Unit ($)</Label><Input type="number" step="0.01" value={costPerUnit} onChange={(e) => setCostPerUnit(e.target.value)} placeholder="0.00" data-testid="input-inv-cost" /></div>
                <div><Label>Supplier</Label><Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Supplier name" data-testid="input-inv-supplier" /></div>
                <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..." data-testid="input-inv-notes" /></div>
                <div className="flex items-center gap-3 pt-2">
                  <Button style={{ background: "#c2703e", color: "#fff" }} className="gap-1.5" onClick={handleSubmit} disabled={createItem.isPending || !name.trim()} data-testid="button-submit-inventory">
                    {createItem.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add Item
                  </Button>
                  <DialogClose asChild><Button variant="outline" data-testid="button-cancel-inventory">Cancel</Button></DialogClose>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {lowStockList.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <Card className="p-4 border-0 flex flex-wrap items-center gap-3" style={{ background: "rgba(239,68,68,0.08)" }} data-testid="alert-low-stock">
            <AlertTriangle className="w-5 h-5" style={{ color: "#ef4444" }} />
            <span className="text-sm font-medium" style={{ color: "#ef4444" }}>
              {lowStockList.length} item{lowStockList.length > 1 ? "s" : ""} below reorder point:
            </span>
            <span className="text-sm" style={{ color: "#e2e8f0" }}>
              {lowStockList.map((it) => it.name).join(", ")}
            </span>
          </Card>
        </motion.div>
      )}

      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList style={{ background: "rgba(255,255,255,0.06)" }} className="flex-wrap">
          <TabsTrigger value="all" data-testid="filter-all">All ({list.length})</TabsTrigger>
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat} data-testid={`filter-${cat}`}>
              {cat.charAt(0).toUpperCase() + cat.slice(1).replace("-", " ")}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent data-testid="dialog-edit-quantity">
          <DialogHeader><DialogTitle>Update Quantity</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm" style={{ color: "#e2e8f0" }}>{editItem?.name}</p>
            <div><Label>New Quantity</Label><Input type="number" value={editQty} onChange={(e) => setEditQty(e.target.value)} data-testid="input-edit-qty" /></div>
            <div className="flex items-center gap-3">
              <Button style={{ background: "#c2703e", color: "#fff" }} onClick={() => editItem && updateQuantity.mutate({ id: editItem.id, currentQuantity: parseInt(editQty) || 0 })} disabled={updateQuantity.isPending} data-testid="button-save-qty">
                {updateQuantity.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </Button>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-12 h-12 mx-auto mb-4" style={{ color: "#64748b", opacity: 0.3 }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: "#f1f5f9" }}>No inventory items</h3>
          <p className="text-sm" style={{ color: "#94a3b8" }}>Add your first inventory item</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item, i) => {
            const isLow = (item.currentQuantity || 0) <= (item.reorderPoint || 0);
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="p-5 border-0" style={{ background: "rgba(255,255,255,0.04)" }} data-testid={`card-inventory-${item.id}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold" style={{ color: "#f1f5f9" }} data-testid={`text-inv-name-${item.id}`}>{item.name}</h3>
                      <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1).replace("-", " ") : "—"}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEditQty(item)} data-testid={`button-edit-qty-${item.id}`}>
                        <Edit2 className="w-3.5 h-3.5" style={{ color: "#94a3b8" }} />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteItem.mutate(item.id)} disabled={deleteItem.isPending} data-testid={`button-delete-inv-${item.id}`}>
                        <Trash2 className="w-4 h-4" style={{ color: "#64748b" }} />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge className="text-[10px]" style={{
                      background: isLow ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
                      color: isLow ? "#ef4444" : "#10b981",
                      border: "none",
                    }} data-testid={`badge-inv-qty-${item.id}`}>
                      {isLow && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {item.currentQuantity} {item.unit}
                    </Badge>
                  </div>
                  <div className="space-y-1.5 text-xs" style={{ color: "#94a3b8" }}>
                    <div className="flex justify-between">
                      <span>Reorder at</span>
                      <span style={{ color: "#e2e8f0" }}>{item.reorderPoint} {item.unit}</span>
                    </div>
                    {item.costPerUnit != null && (
                      <div className="flex justify-between">
                        <span>Cost</span>
                        <span style={{ color: "#e2e8f0" }}>${Number(item.costPerUnit).toFixed(2)}/{item.unit}</span>
                      </div>
                    )}
                    {item.supplier && (
                      <div className="flex justify-between">
                        <span>Supplier</span>
                        <span style={{ color: "#e2e8f0" }} className="truncate ml-4">{item.supplier}</span>
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
