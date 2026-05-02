import { useState } from "react";
import DashboardLayout from "./layout";
import { useGetMySubscription, useListPlans, useGetUsageLimits, useUpgradePlan } from "@workspace/api-client-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, Zap, Crown, Star, ArrowRight, Loader2 } from "lucide-react";

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Star className="h-5 w-5 text-gray-400" />,
  pro: <Zap className="h-5 w-5 text-blue-500" />,
  business: <Crown className="h-5 w-5 text-yellow-500" />,
};

const PLAN_COLORS: Record<string, string> = {
  free: "border-gray-200 bg-gray-50",
  pro: "border-blue-200 bg-blue-50 ring-2 ring-blue-500",
  business: "border-yellow-200 bg-yellow-50",
};

export default function Subscription() {
  const { data: subscription } = useGetMySubscription();
  const { data: plans } = useListPlans();
  const { data: limits } = useGetUsageLimits();
  const upgradeMutation = useUpgradePlan();
  const { toast } = useToast();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  async function handleUpgrade(planId: string) {
    setUpgrading(planId);
    try {
      await upgradeMutation.mutateAsync({ data: { plan: planId } });
      toast({ title: "Plan upgraded!", description: `You're now on the ${planId} plan.` });
    } catch {
      toast({ title: "Upgrade failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setUpgrading(null);
    }
  }

  const currentPlan = subscription?.plan ?? "free";

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
          <p className="text-gray-500 mt-1">Manage your plan and usage</p>
        </div>

        {/* Current Usage */}
        {limits && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {PLAN_ICONS[currentPlan]}
                Current Plan: <span className="capitalize font-bold">{currentPlan}</span>
                <Badge variant={currentPlan === "free" ? "secondary" : "default"} className="ml-2">Active</Badge>
              </CardTitle>
              <CardDescription>Your current usage this period</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(["products", "orders", "stores"] as const).map((resource) => {
                  const used = limits[resource].used;
                  const limit = limits[resource].limit;
                  const pct = limit >= 9999 ? 0 : Math.min(100, (used / limit) * 100);
                  const isUnlimited = limit >= 9999;
                  return (
                    <div key={resource} className="bg-white rounded-lg border p-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium capitalize text-gray-700">{resource}</span>
                        <span className="text-sm text-gray-500">
                          {used} / {isUnlimited ? "∞" : limit}
                        </span>
                      </div>
                      {!isUnlimited && <Progress value={pct} className={pct > 80 ? "[&>div]:bg-red-500" : "[&>div]:bg-primary"} />}
                      {isUnlimited && <div className="text-xs text-green-600 font-medium">Unlimited</div>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plans */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(plans ?? []).map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl border-2 p-6 flex flex-col transition-all ${PLAN_COLORS[plan.id] ?? "border-gray-200"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {PLAN_ICONS[plan.id]}
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  {plan.id === "pro" && <Badge className="bg-blue-500 text-white text-xs">Popular</Badge>}
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-500 text-sm">/month</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.id === currentPlan ? (
                  <Button disabled className="w-full">Current Plan</Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.id === "pro" ? "default" : "outline"}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={upgrading === plan.id}
                  >
                    {upgrading === plan.id ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" />Upgrading...</>
                    ) : (
                      <>{currentPlan === "free" ? "Upgrade" : "Switch"} to {plan.name} <ArrowRight className="h-4 w-4 ml-1" /></>
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
