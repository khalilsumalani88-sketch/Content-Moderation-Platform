import { useState } from "react";
import { useLocation } from "wouter";
import { useGenerateStore, useCreateStore, useCreateCategory } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMyStoreQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Store, Package, CheckCircle, Loader2, Sparkles, ArrowRight } from "lucide-react";

const steps = ["Describe Your Business", "Configure Store", "Review & Launch"];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [description, setDescription] = useState("");
  const [generated, setGenerated] = useState<{ name: string; slug: string; description: string; categories: string[]; sampleProducts: Array<{ name: string; price: number; category: string; description: string }> } | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", whatsappNumber: "", currency: "USD", theme: "light" });
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateStore = useGenerateStore();
  const createStore = useCreateStore();
  const createCategory = useCreateCategory();

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast({ title: "Please describe your business", variant: "destructive" });
      return;
    }
    try {
      const result = await generateStore.mutateAsync({ data: { description } });
      setGenerated(result as any);
      setForm(f => ({ ...f, name: result.name, slug: result.slug }));
      setStep(1);
    } catch {
      toast({ title: "Failed to generate store config", variant: "destructive" });
    }
  };

  const handleConfigNext = () => {
    if (!form.name || !form.slug || !form.whatsappNumber) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setStep(2);
  };

  const handleLaunch = async () => {
    try {
      await createStore.mutateAsync({ data: { ...form } });
      if (generated?.categories) {
        for (const cat of generated.categories.slice(0, 5)) {
          try { await createCategory.mutateAsync({ data: { name: cat } }); } catch {}
        }
      }
      queryClient.invalidateQueries({ queryKey: getGetMyStoreQueryKey() });
      setLocation("/dashboard");
    } catch {
      toast({ title: "Failed to create store. The slug may already be taken.", variant: "destructive" });
    }
  };

  const isLaunching = createStore.isPending || createCategory.isPending;

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="onboarding-page">
      {/* Header */}
      <div className="bg-sidebar py-4 px-6">
        <div className="flex items-center gap-2 text-sidebar-foreground">
          <Store className="w-5 h-5" />
          <span className="font-bold">StoreLink</span>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i < step ? "bg-primary text-primary-foreground" :
                  i === step ? "bg-primary text-primary-foreground" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
                {i < steps.length - 1 && <div className="w-8 h-px bg-border mx-1" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          {/* Step 0: Describe business */}
          {step === 0 && (
            <div className="space-y-6" data-testid="step-describe">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Tell us about your business</h2>
                <p className="text-muted-foreground mt-2">Our AI will generate your store name, categories, and sample products from your description.</p>
              </div>
              <div className="space-y-3">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  data-testid="input-description"
                  placeholder="e.g., I sell handmade jewelry including rings, necklaces, and earrings. My pieces are inspired by nature and made with sterling silver..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
              </div>
              <Button
                onClick={handleGenerate}
                disabled={generateStore.isPending}
                className="w-full gap-2"
                data-testid="button-generate"
              >
                {generateStore.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generateStore.isPending ? "Generating..." : "Generate My Store"}
              </Button>
            </div>
          )}

          {/* Step 1: Configure store */}
          {step === 1 && (
            <div className="space-y-6" data-testid="step-configure">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Configure your store</h2>
                <p className="text-muted-foreground mt-2">We pre-filled some fields from your description. Review and adjust as needed.</p>
              </div>

              {generated && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm">
                  <p className="font-medium text-primary mb-2 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> AI Generated</p>
                  <p className="text-muted-foreground">{generated.description}</p>
                  <p className="mt-2 text-muted-foreground">Suggested categories: {generated.categories.join(", ")}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Store Name *</Label>
                  <Input id="name" data-testid="input-store-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="My Store" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Store URL Slug *</Label>
                  <Input id="slug" data-testid="input-store-slug" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))} placeholder="my-store" />
                  <p className="text-xs text-muted-foreground">store/{form.slug || "my-store"}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp Number *</Label>
                  <Input id="whatsapp" data-testid="input-whatsapp" value={form.whatsappNumber} onChange={e => setForm(f => ({ ...f, whatsappNumber: e.target.value }))} placeholder="+1234567890" />
                  <p className="text-xs text-muted-foreground">Include country code (e.g. +1 for US)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input id="currency" data-testid="input-currency" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value.toUpperCase() }))} placeholder="USD" maxLength={3} />
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1">Back</Button>
                <Button onClick={handleConfigNext} className="flex-1 gap-2" data-testid="button-next">
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <div className="space-y-6" data-testid="step-review">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Ready to launch</h2>
                <p className="text-muted-foreground mt-2">Review your store details before going live.</p>
              </div>

              <div className="border border-border rounded-xl overflow-hidden">
                <div className="bg-muted/50 px-5 py-3 border-b border-border">
                  <span className="text-sm font-semibold text-foreground">Store Summary</span>
                </div>
                <div className="divide-y divide-border">
                  {[
                    { label: "Store Name", value: form.name },
                    { label: "Store URL", value: `/store/${form.slug}` },
                    { label: "WhatsApp", value: form.whatsappNumber },
                    { label: "Currency", value: form.currency },
                    ...(generated ? [{ label: "Categories", value: generated.categories.join(", ") }] : []),
                    ...(generated ? [{ label: "Sample Products", value: `${generated.sampleProducts.length} products will be suggested` }] : []),
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-start justify-between px-5 py-3.5">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className="text-sm font-medium text-foreground text-right max-w-[60%]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button onClick={handleLaunch} disabled={isLaunching} className="flex-1 gap-2" data-testid="button-launch">
                  {isLaunching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                  {isLaunching ? "Creating..." : "Launch Store"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
