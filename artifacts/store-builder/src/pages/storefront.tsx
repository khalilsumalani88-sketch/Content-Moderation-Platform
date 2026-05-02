import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetStoreBySlug, useListPublicProducts, useListPublicCategories, useCreateOrder } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Search, MessageCircle, Plus, Minus, Trash2, X, Store, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
}

export default function Storefront() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ name: "", phone: "", notes: "" });
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "checkout">("cart");

  const { data: store, isLoading: storeLoading, isError: storeError } = useGetStoreBySlug(slug ?? "");
  const { data: products } = useListPublicProducts(slug ?? "", search || selectedCategory ? { search: search || undefined, category: selectedCategory || undefined } : undefined);
  const { data: categories } = useListPublicCategories(slug ?? "");
  const createOrder = useCreateOrder();

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const currency = store?.currency ?? "USD";

  const addToCart = (product: { id: number; name: string; price: number; imageUrl?: string | null }) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId: product.id, productName: product.name, price: Number(product.price), quantity: 1, imageUrl: product.imageUrl }];
    });
    toast({ title: `${product.name} added to cart`, duration: 1500 });
  };

  const updateQty = (productId: number, delta: number) => {
    setCart(prev => prev.map(i => i.productId === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  };

  const handleWhatsAppCheckout = async () => {
    if (!checkoutForm.name.trim()) {
      toast({ title: "Please enter your name", variant: "destructive" });
      return;
    }
    if (!store) return;

    try {
      await createOrder.mutateAsync({
        data: {
          storeId: (store as any).id,
          customerName: checkoutForm.name,
          customerPhone: checkoutForm.phone || null,
          items: cart.map(({ productId, productName, price, quantity }) => ({ productId, productName, price, quantity })),
          total: cartTotal,
          notes: checkoutForm.notes || null,
        }
      });
    } catch {}

    const itemLines = cart.map(i => `• ${i.productName} x${i.quantity} — ${currency} ${(i.price * i.quantity).toFixed(2)}`).join("\n");
    const msg = `Hi! I'd like to place an order from ${store.name}:\n\n${itemLines}\n\nTotal: ${currency} ${cartTotal.toFixed(2)}\n\nName: ${checkoutForm.name}${checkoutForm.phone ? `\nPhone: ${checkoutForm.phone}` : ""}${checkoutForm.notes ? `\nNotes: ${checkoutForm.notes}` : ""}`;

    const whatsappNum = store.whatsappNumber.replace(/\D/g, "");
    window.open(`https://wa.me/${whatsappNum}?text=${encodeURIComponent(msg)}`, "_blank");

    setCart([]);
    setCartOpen(false);
    setCheckoutStep("cart");
    setCheckoutForm({ name: "", phone: "", notes: "" });
    toast({ title: "Order sent via WhatsApp!", duration: 3000 });
  };

  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (storeError || !store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <Store className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Store not found</h1>
        <p className="text-muted-foreground mb-6">The store "{slug}" doesn't exist or has been removed.</p>
        <Button onClick={() => setLocation("/")} variant="outline">Go home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="storefront-page">
      {/* Header / Banner */}
      <div className="bg-sidebar text-sidebar-foreground">
        {store.bannerUrl && (
          <div className="h-36 sm:h-48 overflow-hidden">
            <img src={store.bannerUrl} alt="Store banner" className="w-full h-full object-cover opacity-60" />
          </div>
        )}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {store.logoUrl ? (
              <img src={store.logoUrl} alt="Logo" className="w-14 h-14 rounded-xl object-cover border-2 border-sidebar-border" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-sidebar-primary flex items-center justify-center">
                <Store className="w-7 h-7 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold" data-testid="store-name">{store.name}</h1>
              {store.description && <p className="text-sm text-sidebar-foreground/70 mt-0.5 max-w-md line-clamp-2">{store.description}</p>}
            </div>
          </div>
          <Button
            variant="outline"
            className="relative gap-2 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent bg-sidebar-accent/50"
            onClick={() => setCartOpen(true)}
            data-testid="button-cart"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Search & filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
          {categories && categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedCategory("")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${selectedCategory === "" ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background hover:bg-muted"}`}
                data-testid="filter-all"
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${selectedCategory === cat.name ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background hover:bg-muted"}`}
                  data-testid={`filter-${cat.name}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Products grid */}
        {!products || products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Store className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No products available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {products.map(product => {
              const cartItem = cart.find(i => i.productId === product.id);
              return (
                <div key={product.id} className="bg-card border border-border rounded-xl overflow-hidden group flex flex-col" data-testid={`card-product-${product.id}`}>
                  <div className="h-40 bg-muted flex items-center justify-center overflow-hidden">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                    ) : (
                      <Image className="w-8 h-8 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <p className="font-semibold text-sm leading-tight mb-1" data-testid={`product-name-${product.id}`}>{product.name}</p>
                    {product.category && <p className="text-xs text-muted-foreground mb-2">{product.category}</p>}
                    {product.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{product.description}</p>}
                    <div className="mt-auto">
                      <p className="font-bold text-primary mb-2" data-testid={`price-${product.id}`}>{currency} {Number(product.price).toFixed(2)}</p>
                      {cartItem ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQty(product.id, -1)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-bold min-w-[20px] text-center">{cartItem.quantity}</span>
                          <button onClick={() => updateQty(product.id, 1)} className="w-7 h-7 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors">
                            <Plus className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ) : (
                        <Button size="sm" className="w-full text-xs" onClick={() => addToCart(product)} data-testid={`button-add-${product.id}`}>
                          Add to cart
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating cart button for mobile */}
      {cartCount > 0 && !cartOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 sm:hidden">
          <Button onClick={() => setCartOpen(true)} className="gap-2 rounded-full px-6 shadow-xl">
            <ShoppingCart className="w-4 h-4" />
            {cartCount} items · {currency} {cartTotal.toFixed(2)}
          </Button>
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => { setCartOpen(false); setCheckoutStep("cart"); }} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-96 bg-background border-l border-border flex flex-col shadow-2xl" data-testid="cart-drawer">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-bold text-lg">{checkoutStep === "checkout" ? "Checkout" : "Your Cart"}</h2>
              <button onClick={() => { setCartOpen(false); setCheckoutStep("cart"); }} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="button-close-cart">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {checkoutStep === "cart" ? (
                <>
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                      <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground">Your cart is empty</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {cart.map(item => (
                        <div key={item.productId} className="flex items-center gap-3 px-5 py-4" data-testid={`cart-item-${item.productId}`}>
                          <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
                            {item.imageUrl ? <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" /> : <Image className="w-6 h-6 text-muted-foreground/30 m-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">{currency} {item.price.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQty(item.productId, -1)} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQty(item.productId, 1)} className="w-6 h-6 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90">
                              <Plus className="w-3 h-3 text-white" />
                            </button>
                            <button onClick={() => removeFromCart(item.productId)} className="w-6 h-6 ml-1 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="px-5 py-6 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Order Summary</p>
                    <div className="space-y-1.5">
                      {cart.map(item => (
                        <div key={item.productId} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.productName} x{item.quantity}</span>
                          <span className="font-medium">{currency} {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3 pt-2 border-t border-border">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Your Details</p>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name *</label>
                      <Input placeholder="Your name" value={checkoutForm.name} onChange={e => setCheckoutForm(f => ({ ...f, name: e.target.value }))} data-testid="input-checkout-name" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone (optional)</label>
                      <Input placeholder="+1234567890" value={checkoutForm.phone} onChange={e => setCheckoutForm(f => ({ ...f, phone: e.target.value }))} data-testid="input-checkout-phone" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Notes (optional)</label>
                      <Input placeholder="e.g., Delivery address, special requests..." value={checkoutForm.notes} onChange={e => setCheckoutForm(f => ({ ...f, notes: e.target.value }))} data-testid="input-checkout-notes" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="px-5 py-4 border-t border-border bg-background space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-xl text-primary">{currency} {cartTotal.toFixed(2)}</span>
                </div>
                {checkoutStep === "cart" ? (
                  <Button className="w-full gap-2" onClick={() => setCheckoutStep("checkout")} data-testid="button-proceed-checkout">
                    <MessageCircle className="w-4 h-4" />
                    Proceed to Checkout
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setCheckoutStep("cart")}>Back</Button>
                    <Button
                      className="flex-1 gap-2"
                      onClick={handleWhatsAppCheckout}
                      disabled={createOrder.isPending}
                      data-testid="button-whatsapp-checkout"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Order via WhatsApp
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
