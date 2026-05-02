import { useState } from "react";
import DashboardLayout from "@/components/layout";
import { useGetAdminStats, useAdminListStores, useGetAdminAnalytics, useAdminUpdateStorePlan } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Store, Package, ShoppingCart, DollarSign, TrendingUp, Users, Shield, Search, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

const PLAN_BADGE: Record<string, string> = {
  free: "bg-gray-100 text-gray-700",
  pro: "bg-blue-100 text-blue-700",
  business: "bg-yellow-100 text-yellow-700",
};

const PIE_COLORS = ["#94a3b8", "#3b82f6", "#f59e0b"];

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number | string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{typeof value === "number" && label.toLowerCase().includes("revenue") ? `$${Number(value).toFixed(2)}` : value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </div>
          <div className="rounded-lg bg-gray-50 p-2">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function OverviewTab() {
  const { data: stats, isLoading } = useGetAdminStats();

  if (isLoading) return <div className="flex items-center gap-2 text-gray-500 py-8"><Loader2 className="h-5 w-5 animate-spin" /> Loading...</div>;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Store className="h-5 w-5 text-blue-500" />} label="Total Stores" value={stats.totalStores} sub={`+${stats.newStoresThisMonth} this month`} />
        <StatCard icon={<Package className="h-5 w-5 text-purple-500" />} label="Total Products" value={stats.totalProducts} />
        <StatCard icon={<ShoppingCart className="h-5 w-5 text-green-500" />} label="Total Orders" value={stats.totalOrders} sub={`+${stats.newOrdersThisMonth} this month`} />
        <StatCard icon={<DollarSign className="h-5 w-5 text-yellow-500" />} label="Total Revenue" value={stats.totalRevenue} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { plan: "Free", count: stats.freeUsers, color: "bg-gray-50 border-gray-200" },
          { plan: "Pro", count: stats.proUsers, color: "bg-blue-50 border-blue-200" },
          { plan: "Business", count: stats.businessUsers, color: "bg-yellow-50 border-yellow-200" },
        ].map((p) => (
          <div key={p.plan} className={`rounded-lg border-2 p-4 ${p.color}`}>
            <p className="text-sm text-gray-500 font-medium">{p.plan} Users</p>
            <p className="text-3xl font-bold text-gray-900">{p.count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsTab() {
  const { data: analytics, isLoading } = useGetAdminAnalytics();

  if (isLoading) return <div className="flex items-center gap-2 text-gray-500 py-8"><Loader2 className="h-5 w-5 animate-spin" /> Loading analytics...</div>;
  if (!analytics) return null;

  const pieData = [
    { name: "Free", value: analytics.planDistribution.free },
    { name: "Pro", value: analytics.planDistribution.pro },
    { name: "Business", value: analytics.planDistribution.business },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Revenue — Last 30 Days</CardTitle></CardHeader>
        <CardContent>
          {analytics.revenueByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                <Bar dataKey="revenue" fill="hsl(142.1 76.2% 36.3%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm py-8 text-center">No revenue data yet</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Plan Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Top Stores</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.topStores.length === 0 && <p className="text-gray-400 text-sm">No data yet</p>}
              {analytics.topStores.slice(0, 5).map((s, i) => (
                <div key={s.storeId} className="flex items-center justify-between py-1 border-b last:border-b-0">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm w-4">#{i + 1}</span>
                    <span className="text-sm font-medium text-gray-900">{s.storeName}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">${Number(s.revenue).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">{s.orders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StoresTab() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);
  const { data, isLoading } = useAdminListStores({ search: debouncedSearch || undefined, page, limit: 20 });
  const updatePlanMutation = useAdminUpdateStorePlan();
  const { toast } = useToast();

  async function handlePlanChange(storeId: number, plan: string) {
    try {
      await updatePlanMutation.mutateAsync({ id: storeId, data: { plan } });
      toast({ title: "Plan updated" });
    } catch {
      toast({ title: "Failed to update plan", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input placeholder="Search stores..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-500"><Loader2 className="h-5 w-5 animate-spin" /> Loading stores...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Store", "Owner", "Slug", "Plan", "Products", "Orders", "Joined"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data?.stores ?? []).map((store) => (
                <tr key={store.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{store.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono">{store.userId.slice(0, 16)}...</td>
                  <td className="px-4 py-3 text-gray-500">{store.slug}</td>
                  <td className="px-4 py-3">
                    <Select defaultValue={store.plan} onValueChange={(v) => handlePlanChange(store.id, v)}>
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-center">{store.productCount}</td>
                  <td className="px-4 py-3 text-center">{store.orderCount}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(store.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {(data?.stores ?? []).length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No stores found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > data.limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing {(page - 1) * data.limit + 1}–{Math.min(page * data.limit, data.total)} of {data.total}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page * data.limit >= data.total} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPanel() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-red-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-500 text-sm">Platform management and analytics</p>
          </div>
          <Badge className="ml-2 bg-red-100 text-red-700">Admin Only</Badge>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="overview" className="gap-1"><TrendingUp className="h-4 w-4" />Overview</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1"><BarChart className="h-4 w-4" />Analytics</TabsTrigger>
            <TabsTrigger value="stores" className="gap-1"><Store className="h-4 w-4" />Stores</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="analytics"><AnalyticsTab /></TabsContent>
          <TabsContent value="stores"><StoresTab /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
