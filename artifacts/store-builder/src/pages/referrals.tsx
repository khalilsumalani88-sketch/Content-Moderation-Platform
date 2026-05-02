import { useState } from "react";
import DashboardLayout from "@/components/layout";
import { useGetMyReferralCode, useGetReferralStats, useApplyReferralCode } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Gift, Users, Star, Share2, Loader2 } from "lucide-react";

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
    >
      {copied ? <><Check className="h-4 w-4 text-green-500" />{label ? "Copied!" : ""}</> : <><Copy className="h-4 w-4" />{label ?? ""}</>}
    </Button>
  );
}

export default function Referrals() {
  const { data: referralCode, refetch: refetchCode } = useGetMyReferralCode();
  const { data: stats, refetch: refetchStats } = useGetReferralStats();
  const applyMutation = useApplyReferralCode();
  const { toast } = useToast();
  const [applyCode, setApplyCode] = useState("");
  const [applying, setApplying] = useState(false);

  async function handleApply() {
    if (!applyCode.trim()) return;
    setApplying(true);
    try {
      const result = await applyMutation.mutateAsync({ data: { code: applyCode.trim() } });
      toast({ title: "Referral applied!", description: (result as any).message });
      setApplyCode("");
      refetchCode();
      refetchStats();
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Could not apply referral code.";
      toast({ title: "Failed to apply", description: msg, variant: "destructive" });
    } finally {
      setApplying(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referral Program</h1>
          <p className="text-gray-500 mt-1">Share your code and earn rewards for every friend who joins</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: <Users className="h-5 w-5 text-blue-500" />, label: "Total Referrals", value: stats?.totalReferrals ?? 0 },
            { icon: <Check className="h-5 w-5 text-green-500" />, label: "Successful", value: stats?.successfulReferrals ?? 0 },
            { icon: <Gift className="h-5 w-5 text-purple-500" />, label: "Rewards Pending", value: stats?.rewardsPending ?? 0 },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-50 p-2">{stat.icon}</div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* My Referral Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" />Your Referral Code</CardTitle>
            <CardDescription>Share this code with friends. They get 1 month free Pro when they sign up.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {referralCode ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                    <span className="text-3xl font-mono font-bold tracking-widest text-primary">{referralCode.code}</span>
                  </div>
                  <CopyButton text={referralCode.code} label="Code" />
                </div>

                <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
                  <span className="text-sm text-gray-600 flex-1 truncate">{referralCode.referralUrl}</span>
                  <CopyButton text={referralCode.referralUrl} label="Link" />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      const msg = encodeURIComponent(`Join me on WhatsApp Store Builder and get 1 month free Pro! Use my referral code: ${referralCode.code} or sign up here: ${referralCode.referralUrl}`);
                      window.open(`https://wa.me/?text=${msg}`, "_blank");
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                    Share via WhatsApp
                  </Button>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800 font-medium">🎁 Reward: Earn 1 month free Pro for every friend who upgrades!</p>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading your referral code...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Apply a Referral Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5 text-purple-500" />Apply a Referral Code</CardTitle>
            <CardDescription>Have a friend's referral code? Enter it here to get your reward.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 max-w-sm">
              <Input
                placeholder="Enter referral code"
                value={applyCode}
                onChange={(e) => setApplyCode(e.target.value.toUpperCase())}
                className="font-mono"
                maxLength={12}
              />
              <Button onClick={handleApply} disabled={applying || !applyCode.trim()}>
                {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
