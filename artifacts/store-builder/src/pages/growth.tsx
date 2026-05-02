import { useState } from "react";
import DashboardLayout from "@/components/layout";
import { useGetQrCode, useGetShareLink, useSendBroadcast } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, Share2, Megaphone, Copy, Check, Download, ExternalLink, Loader2 } from "lucide-react";

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button variant="outline" size="sm" className="gap-2" onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
      {copied ? <><Check className="h-4 w-4 text-green-500" />Copied!</> : <><Copy className="h-4 w-4" />{label}</>}
    </Button>
  );
}

function QrCodePanel() {
  const { data, isLoading } = useGetQrCode();

  function handleDownload() {
    if (!data?.svg) return;
    const blob = new Blob([data.svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "store-qr-code.svg";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) return <div className="flex items-center gap-2 text-gray-500"><Loader2 className="h-4 w-4 animate-spin" />Loading QR code...</div>;

  return (
    <div className="space-y-4">
      {data?.svg ? (
        <>
          <div className="flex justify-center">
            <div
              className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm inline-block"
              dangerouslySetInnerHTML={{ __html: data.svg }}
            />
          </div>
          <p className="text-sm text-gray-500 text-center break-all">{data.url}</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleDownload}>
              <Download className="h-4 w-4" /> Download SVG
            </Button>
            <CopyButton text={data.url} label="Copy Link" />
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(data.url, "_blank")}>
              <ExternalLink className="h-4 w-4" /> Open Store
            </Button>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            💡 Print this QR code and place it at your physical store, on packaging, or business cards for instant customer access.
          </div>
        </>
      ) : (
        <p className="text-gray-500">No store found. Please create a store first.</p>
      )}
    </div>
  );
}

function ShareLinkPanel() {
  const { data, isLoading } = useGetShareLink();

  if (isLoading) return <div className="flex items-center gap-2 text-gray-500"><Loader2 className="h-4 w-4 animate-spin" />Loading share links...</div>;

  if (!data) return <p className="text-gray-500">No store found. Please create a store first.</p>;

  const shareChannels = [
    { label: "Store Link", url: data.url, icon: "🔗", color: "bg-gray-50 border-gray-200" },
    { label: "Share on WhatsApp", url: data.whatsappUrl, icon: "💬", color: "bg-green-50 border-green-200" },
    { label: "Share on Twitter/X", url: data.twitterUrl, icon: "🐦", color: "bg-sky-50 border-sky-200" },
    { label: "Share on Facebook", url: data.facebookUrl, icon: "👍", color: "bg-blue-50 border-blue-200" },
  ];

  return (
    <div className="space-y-3">
      {shareChannels.map((ch) => (
        <div key={ch.label} className={`flex items-center gap-3 rounded-lg border p-3 ${ch.color}`}>
          <span className="text-xl">{ch.icon}</span>
          <span className="text-sm text-gray-700 flex-1 truncate font-medium">{ch.label}</span>
          <div className="flex gap-2">
            <CopyButton text={ch.url} />
            <Button size="sm" variant="outline" className="gap-1" onClick={() => window.open(ch.url, "_blank")}>
              <ExternalLink className="h-3 w-3" />Open
            </Button>
          </div>
        </div>
      ))}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
        📈 Share your store link across all platforms to drive more traffic and orders!
      </div>
    </div>
  );
}

function BroadcastPanel() {
  const [form, setForm] = useState({ type: "promotion" as "promotion" | "new_product" | "announcement", message: "" });
  const [result, setResult] = useState<{ whatsappUrl: string; message: string; characterCount: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const broadcastMutation = useSendBroadcast();
  const { toast } = useToast();

  async function handleGenerate() {
    if (!form.message.trim()) { toast({ title: "Message required", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const data = await broadcastMutation.mutateAsync({ data: form });
      setResult(data as any);
    } catch {
      toast({ title: "Failed to generate broadcast", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const charCount = result?.characterCount ?? 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Message Type</Label>
        <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as any }))}>
          <SelectTrigger className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="promotion">🎉 Promotion / Sale</SelectItem>
            <SelectItem value="new_product">🆕 New Product</SelectItem>
            <SelectItem value="announcement">📢 Announcement</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Your Message</Label>
        <Textarea
          placeholder="e.g. Get 20% off all orders this weekend only!"
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          rows={3}
        />
      </div>
      <Button onClick={handleGenerate} disabled={loading} className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
        Generate Broadcast
      </Button>

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-green-800">Broadcast Message Ready</p>
            <span className="text-xs text-gray-500">{charCount} characters</span>
          </div>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-white border rounded p-3">{result.message}</pre>
          <div className="flex gap-2">
            <Button size="sm" className="gap-2 bg-[#25D366] hover:bg-[#25D366]/90 text-white" onClick={() => window.open(result.whatsappUrl, "_blank")}>
              <Share2 className="h-4 w-4" /> Send via WhatsApp
            </Button>
            <CopyButton text={result.message} label="Copy Message" />
          </div>
          <p className="text-xs text-gray-500">💡 Click "Send via WhatsApp" to open WhatsApp Web and send this message to your customer list.</p>
        </div>
      )}
    </div>
  );
}

export default function Growth() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Growth Tools</h1>
          <p className="text-gray-500 mt-1">Grow your store with QR codes, sharing, and WhatsApp broadcasts</p>
        </div>

        <Tabs defaultValue="qr">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="qr" className="gap-1"><QrCode className="h-4 w-4" />QR Code</TabsTrigger>
            <TabsTrigger value="share" className="gap-1"><Share2 className="h-4 w-4" />Share</TabsTrigger>
            <TabsTrigger value="broadcast" className="gap-1"><Megaphone className="h-4 w-4" />Broadcast</TabsTrigger>
          </TabsList>

          <TabsContent value="qr">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5 text-gray-700" />Store QR Code</CardTitle>
                <CardDescription>Customers scan this to instantly open your store</CardDescription>
              </CardHeader>
              <CardContent><QrCodePanel /></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="share">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Share2 className="h-5 w-5 text-blue-500" />Share Your Store</CardTitle>
                <CardDescription>Spread the word across social media and messaging apps</CardDescription>
              </CardHeader>
              <CardContent><ShareLinkPanel /></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="broadcast">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-orange-500" />WhatsApp Broadcast</CardTitle>
                <CardDescription>Create a formatted WhatsApp message to send to your customer list</CardDescription>
              </CardHeader>
              <CardContent><BroadcastPanel /></CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
