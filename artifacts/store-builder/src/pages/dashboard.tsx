import DashboardLayout from "@/components/layout";
import { useGetDashboardStats, useGetRecentOrders, useGetTopProducts, useGetMyStore } from "@workspace/api-client-react";

import { ShoppingBag, DollarSign, Package, Clock, TrendingUp, ExternalLink } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: recentOrders } = useGetRecentOrders();
  const { data: topProducts } = useGetTopProducts();
  const { data: store } = useGetMyStore();

  const currency = store?.currency ?? "USD";

  const statCards = [
    { label: "Total Orders", value: stats?.totalOrders ?? 0, icon: ShoppingBag, sub: `${stats?.ordersThisMonth ?? 0} this month` },
    { label: "Total Revenue", value: `${currency} ${(stats?.totalRevenue ?? 0).toFixed(2)}`, icon: DollarSign, sub: `${currency} ${(stats?.revenueThisMonth ?? 0).toFixed(2)} this month` },
    { label: "Products", value: stats?.totalProducts ?? 0, icon: Package, sub: "In your catalog" },
    { label: "Pending Orders", value: stats?.pendingOrders ?? 0, icon: Clock, sub: `${stats?.completedOrders ?? 0} completed` },
  ];

  return (
    <DashboardLayout>
      <div data-testid="dashboard-page">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Overview of your store performance</p>
          </div>
          {store && (
            <a
              href={`/store/${store.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
              data-testid="link-view-store"
            >
              View Store <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, sub }) => (
            <Card key={label} data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {statsLoading ? <span className="inline-block w-16 h-7 bg-muted animate-pulse rounded" /> : value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
                  <Link href="/orders">
                    <a className="text-xs text-primary hover:underline" data-testid="link-all-orders">View all</a>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {!recentOrders || recentOrders.length === 0 ? (
                  <div className="px-6 py-10 text-center text-muted-foreground text-sm">
                    No orders yet. Share your store link to start receiving orders.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {recentOrders.slice(0, 6).map((order) => (
                      <Link key={order.id} href={`/orders/${order.id}`}>
                        <a
                          className="flex items-center justify-between px-6 py-3.5 hover:bg-muted/50 transition-colors"
                          data-testid={`row-order-${order.id}`}
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">{order.customerName}</p>
                            <p className="text-xs text-muted-foreground">{order.items.length} item{order.items.length !== 1 ? "s" : ""} · {new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold">{currency} {Number(order.total).toFixed(2)}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                              {order.status}
                            </span>
                          </div>
                        </a>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <div>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Top Products</CardTitle>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {!topProducts || topProducts.length === 0 ? (
                  <div className="px-6 py-10 text-center text-muted-foreground text-sm">
                    No sales data yet.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {topProducts.map((product, i) => (
                      <div key={product.productId} className="flex items-center gap-3 px-5 py-3.5" data-testid={`row-top-product-${product.productId}`}>
                        <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.productName}</p>
                          <p className="text-xs text-muted-foreground">{product.totalOrders} orders</p>
                        </div>
                        <span className="text-sm font-semibold text-primary whitespace-nowrap">
                          {currency} {product.totalRevenue.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
