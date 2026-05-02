import { useState } from "react";
import DashboardLayout from "./layout";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, DollarSign, Image, Copy, Loader2, Check } from "lucide-react";
import { setBaseUrl } from "@workspace/api-client-react";

const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

async function apiFetch(path: string, body: object) {
  const res = await fetch(`${basePath}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getToken()}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function getToken(): Promise<string> {
  return (window as any).__clerkToken ?? "";
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
    >
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

function DescriptionGenerator() {
  const [form, setForm] = useState({ productName: "", category: "", keywords: "", tone: "professional" });
  const [result, setResult] = useState<{ description: string; shortDescription: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleGenerate() {
    if (!form.productName) { toast({ title: "Product name required", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const data = await apiFetch("/ai/generate-description", form);
      setResult(data);
    } catch {
      toast({ title: "Generation failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Product Name *</Label>
          <Input placeholder="e.g. Handmade Leather Wallet" value={form.productName} onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Input placeholder="e.g. Accessories" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Keywords (optional)</Label>
          <Input placeholder="e.g. handmade, premium, durable" value={form.keywords} onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Tone</Label>
          <Select value={form.tone} onValueChange={(v) => setForm((f) => ({ ...f, tone: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="luxury">Luxury</SelectItem>
              <SelectItem value="fun">Fun</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={handleGenerate} disabled={loading} className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        Generate Description
      </Button>

      {result && (
        <div className="space-y-3 bg-green-50 border border-green-200 rounded-lg p-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs text-green-700 font-semibold uppercase">Full Description</Label>
              <CopyButton text={result.description} />
            </div>
            <p className="text-sm text-gray-800">{result.description}</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs text-green-700 font-semibold uppercase">Short Description</Label>
              <CopyButton text={result.shortDescription} />
            </div>
            <p className="text-sm text-gray-600 italic">{result.shortDescription}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function PricingSuggester() {
  const [form, setForm] = useState({ productName: "", category: "", description: "", currency: "USD" });
  const [result, setResult] = useState<{ suggestedPrice: number; priceRange: { min: number; max: number }; reasoning: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleSuggest() {
    if (!form.productName) { toast({ title: "Product name required", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const data = await apiFetch("/ai/pricing-suggestion", form);
      setResult(data);
    } catch {
      toast({ title: "Suggestion failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Product Name *</Label>
          <Input placeholder="e.g. Wireless Earbuds" value={form.productName} onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <Select value={form.currency} onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["USD", "EUR", "GBP", "NGN", "KES", "GHS", "ZAR", "BRL"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Input placeholder="e.g. Electronics" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Description (optional)</Label>
          <Textarea placeholder="Brief product description for better suggestions" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
        </div>
      </div>
      <Button onClick={handleSuggest} disabled={loading} className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
        Suggest Price
      </Button>

      {result && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="text-center bg-white rounded-lg border border-blue-200 px-6 py-3">
              <p className="text-xs text-gray-500 mb-1">Suggested Price</p>
              <p className="text-3xl font-bold text-blue-600">{form.currency} {result.suggestedPrice.toFixed(2)}</p>
            </div>
            <div className="text-center bg-white rounded-lg border border-blue-200 px-4 py-3">
              <p className="text-xs text-gray-500 mb-1">Range</p>
              <p className="text-sm font-semibold text-gray-700">{form.currency} {result.priceRange.min} – {result.priceRange.max}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Reasoning</p>
            <p className="text-sm text-gray-700">{result.reasoning}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ImageEnhancer() {
  const [form, setForm] = useState({ productName: "", category: "", style: "clean_white" });
  const [result, setResult] = useState<{ imageUrl: string; b64_json: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleEnhance() {
    if (!form.productName) { toast({ title: "Product name required", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const data = await apiFetch("/ai/enhance-image", form);
      setResult(data);
    } catch {
      toast({ title: "Image generation failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.imageUrl;
    a.download = `${form.productName.replace(/\s+/g, "-").toLowerCase()}-product.png`;
    a.click();
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Product Name *</Label>
          <Input placeholder="e.g. Ceramic Coffee Mug" value={form.productName} onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Input placeholder="e.g. Kitchenware" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Photo Style</Label>
          <Select value={form.style} onValueChange={(v) => setForm((f) => ({ ...f, style: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="clean_white">Clean White Background</SelectItem>
              <SelectItem value="lifestyle">Lifestyle</SelectItem>
              <SelectItem value="studio">Studio / Dark</SelectItem>
              <SelectItem value="minimal">Minimal Flat Lay</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={handleEnhance} disabled={loading} className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
        {loading ? "Generating image..." : "Generate Product Image"}
      </Button>

      {loading && (
        <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-lg p-4">
          <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
          <p className="text-sm text-purple-700">AI is creating your product image... this may take ~30 seconds</p>
        </div>
      )}

      {result && (
        <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
          <img src={result.imageUrl} alt="Generated product" className="w-full max-w-sm mx-auto rounded-lg shadow-md" />
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={handleDownload}>Download Image</Button>
            <Button size="sm" onClick={() => navigator.clipboard.writeText(result.imageUrl)}>Copy URL</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AiTools() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">AI Tools</h1>
            <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">Beta</Badge>
          </div>
          <p className="text-gray-500 mt-1">Supercharge your store with AI-powered content and insights</p>
        </div>

        <Tabs defaultValue="description">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="description" className="gap-1"><Sparkles className="h-4 w-4" />Description</TabsTrigger>
            <TabsTrigger value="pricing" className="gap-1"><DollarSign className="h-4 w-4" />Pricing</TabsTrigger>
            <TabsTrigger value="image" className="gap-1"><Image className="h-4 w-4" />Image</TabsTrigger>
          </TabsList>

          <TabsContent value="description">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-purple-500" />Product Description Generator</CardTitle>
                <CardDescription>Generate compelling product descriptions instantly with AI</CardDescription>
              </CardHeader>
              <CardContent>
                <DescriptionGenerator />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-blue-500" />AI Pricing Suggestions</CardTitle>
                <CardDescription>Get competitive price recommendations based on market data</CardDescription>
              </CardHeader>
              <CardContent>
                <PricingSuggester />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="image">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Image className="h-5 w-5 text-green-500" />Product Image Generator</CardTitle>
                <CardDescription>Generate professional product images using AI</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageEnhancer />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
