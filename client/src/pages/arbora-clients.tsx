import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Plus, Trash2, Search, Loader2, Phone, Mail, MapPin, StickyNote
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose
} from "@/components/ui/dialog";
import type { ArboristClient } from "@shared/schema";

export default function ArboraClients() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const { data: clients, isLoading } = useQuery<ArboristClient[]>({
    queryKey: ["/api/arborist/clients"],
  });
  const list = clients || [];

  const filtered = list.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email?.toLowerCase().includes(q)) ||
      (c.phone?.toLowerCase().includes(q)) ||
      (c.address?.toLowerCase().includes(q))
    );
  });

  const createClient = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/arborist/clients", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/arborist/clients"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Client added", description: "New client has been created." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add client.", variant: "destructive" });
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/arborist/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/arborist/clients"] });
      toast({ title: "Client removed", description: "Client has been deleted." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete client.", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setNotes("");
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    createClient.mutate({
      name: name.trim(),
      email: email || null,
      phone: phone || null,
      address: address || null,
      notes: notes || null,
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
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <Users className="w-7 h-7" style={{ color: "#c2703e" }} />
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "#f1f5f9" }} data-testid="text-clients-title">
            Clients
          </h1>
        </div>
        <p className="text-sm" style={{ color: "#94a3b8" }}>Manage your client directory</p>
      </motion.div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex-1 min-w-0 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#64748b" }} />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-0"
            style={{ background: "rgba(255,255,255,0.06)", color: "#e2e8f0" }}
            data-testid="input-search-clients"
          />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button style={{ background: "#c2703e", color: "#fff" }} className="gap-1.5" data-testid="button-add-client">
              <Plus className="w-4 h-4" /> Add Client
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-add-client">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Client name" data-testid="input-client-name" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" type="email" data-testid="input-client-email" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" data-testid="input-client-phone" />
              </div>
              <div>
                <Label>Address</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, City, ST" data-testid="input-client-address" />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." data-testid="input-client-notes" />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button
                  style={{ background: "#c2703e", color: "#fff" }}
                  className="gap-1.5"
                  onClick={handleSubmit}
                  disabled={createClient.isPending || !name.trim()}
                  data-testid="button-submit-client"
                >
                  {createClient.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add Client
                </Button>
                <DialogClose asChild>
                  <Button variant="outline" data-testid="button-cancel-client">Cancel</Button>
                </DialogClose>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 mx-auto mb-4" style={{ color: "#64748b", opacity: 0.3 }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: "#f1f5f9" }}>No clients found</h3>
          <p className="text-sm" style={{ color: "#94a3b8" }}>Add your first client to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client, i) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="p-5 border-0" style={{ background: "rgba(255,255,255,0.04)" }} data-testid={`card-client-${client.id}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-sm font-semibold" style={{ color: "#f1f5f9" }} data-testid={`text-client-name-${client.id}`}>
                    {client.name}
                  </h3>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteClient.mutate(client.id)}
                    disabled={deleteClient.isPending}
                    data-testid={`button-delete-client-${client.id}`}
                  >
                    <Trash2 className="w-4 h-4" style={{ color: "#64748b" }} />
                  </Button>
                </div>
                <div className="space-y-2 text-xs" style={{ color: "#94a3b8" }}>
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      <span data-testid={`text-client-email-${client.id}`}>{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                      <span data-testid={`text-client-phone-${client.id}`}>{client.phone}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span data-testid={`text-client-address-${client.id}`}>{client.address}</span>
                    </div>
                  )}
                  {client.notes && (
                    <div className="flex items-center gap-2">
                      <StickyNote className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate" data-testid={`text-client-notes-${client.id}`}>{client.notes}</span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
