import DashboardLayout from "@/components/layout";
import { useListOrders, useGetMyStore, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { Link } from "wouter";
import { ShoppingBag, ChevronRight } from "lucide-react";

const statuses = ["", "pending", "confirmed", "completed", "cancelled"];
const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function Orders() {
  const [status, setStatus] = useState("");
  const { data: store } = useGetMyStore();
  const { data: orders, isLoading } = useListOrders(status ? { status } : undefined, {
    query: { queryKey: getListOrdersQueryKey(status ? { status } : undefined) }
  });

  const currency = store?.currency ?? "USD";

  return (
    <DashboardLayout>
      <div data-testid="orders-page">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">{orders?.length ?? 0} orders total</p>
        </div>

        {/* Status filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {statuses.map(s => (
            <button
              key={s || "all"}
              onClick={() => setStatus(s)}
              data-testid={`filter-status-${s || "all"}`}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                status === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-muted"
              }`}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <h3 className="font-semibold mb-1">No orders {status ? `with status "${status}"` : "yet"}</h3>
            <p className="text-sm text-muted-foreground">Orders from your WhatsApp storefront will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map(order => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <a
                  className="flex items-center justify-between bg-card border border-border rounded-xl px-5 py-4 hover:bg-muted/50 transition-colors group"
                  data-testid={`row-order-${order.id}`}
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2.5 mb-1">
                      <span className="font-semibold text-sm" data-testid={`text-customer-${order.id}`}>{order.customerName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status] ?? "bg-gray-100 text-gray-700"}`} data-testid={`status-${order.id}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""} · {new Date(order.createdAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {order.items.map(i => `${i.productName} x${i.quantity}`).join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-primary" data-testid={`text-total-${order.id}`}>{currency} {Number(order.total).toFixed(2)}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </a>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
