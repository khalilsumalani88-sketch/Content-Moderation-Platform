import DashboardLayout from "@/components/layout";
import { useGetOrder, useUpdateOrderStatus, useGetMyStore, getGetOrderQueryKey, getListOrdersQueryKey, getGetMyStoreQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const nextStatuses: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const orderId = parseInt(id ?? "0");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useGetOrder(orderId, { query: { queryKey: getGetOrderQueryKey(orderId) } });
  const { data: store } = useGetMyStore();
  const updateStatus = useUpdateOrderStatus();
  const [updatingStatus, setUpdatingStatus] = useState("");

  const currency = store?.currency ?? "USD";

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(newStatus);
    try {
      await updateStatus.mutateAsync({ id: orderId, data: { status: newStatus } });
      queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      toast({ title: `Order marked as ${newStatus}` });
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    } finally {
      setUpdatingStatus("");
    }
  };

  const openWhatsApp = () => {
    if (!store || !order) return;
    const items = order.items.map((i: { productName: string; quantity: number; price: number }) => `- ${i.productName} x${i.quantity} — ${currency} ${(i.price * i.quantity).toFixed(2)}`).join("\n");
    const msg = `Order #${order.id} from ${order.customerName}:\n\n${items}\n\nTotal: ${currency} ${Number(order.total).toFixed(2)}`;
    window.open(`https://wa.me/${store.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl" data-testid="order-detail-page">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/orders")} data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Order #{orderId}</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !order ? (
          <div className="text-center py-20 text-muted-foreground">Order not found</div>
        ) : (
          <div className="space-y-4">
            {/* Customer info */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Customer</h2>
              <p className="font-semibold" data-testid="text-customer-name">{order.customerName}</p>
              {order.customerPhone && <p className="text-sm text-muted-foreground">{order.customerPhone}</p>}
              <p className="text-xs text-muted-foreground mt-1">{new Date(order.createdAt).toLocaleString()}</p>
            </div>

            {/* Items */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Order Items</h2>
              </div>
              <div className="divide-y divide-border">
                {order.items.map((item: { productId: number; productName: string; quantity: number; price: number }, i: number) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3.5" data-testid={`row-item-${i}`}>
                    <div>
                      <p className="font-medium text-sm">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity} × {currency} {Number(item.price).toFixed(2)}</p>
                    </div>
                    <span className="font-semibold text-sm">{currency} {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between px-5 py-3.5 bg-muted/50 border-t border-border">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-primary text-lg" data-testid="text-order-total">{currency} {Number(order.total).toFixed(2)}</span>
              </div>
            </div>

            {/* Status + actions */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Status</h2>
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusColors[order.status] ?? "bg-gray-100 text-gray-700"}`} data-testid="status-badge">
                  {order.status}
                </span>
              </div>

              {nextStatuses[order.status]?.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {nextStatuses[order.status].map(s => (
                    <Button
                      key={s}
                      variant={s === "cancelled" ? "destructive" : "default"}
                      size="sm"
                      onClick={() => handleStatusChange(s)}
                      disabled={!!updatingStatus}
                      data-testid={`button-status-${s}`}
                    >
                      {updatingStatus === s ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                      Mark as {s}
                    </Button>
                  ))}
                </div>
              )}

              {order.notes && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{order.notes}</p>
                </div>
              )}
            </div>

            <Button onClick={openWhatsApp} className="w-full gap-2" variant="outline" data-testid="button-whatsapp">
              <MessageCircle className="w-4 h-4" />
              Contact on WhatsApp
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
