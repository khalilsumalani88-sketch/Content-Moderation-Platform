import DashboardLayout from "@/components/layout";
import { useListCategories, useCreateProduct, useGetProduct, useUpdateProduct, useGetMyStore, getListProductsQueryKey, getGetProductQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Store } from "lucide-react";
import { Link } from "wouter";

interface ProductFormValues {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  category: string;
  stock: string;
  isAvailable: boolean;
}

const defaultForm: ProductFormValues = {
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  category: "",
  stock: "",
  isAvailable: true,
};

export default function ProductForm({ isEdit = false }: { isEdit?: boolean }) {
  const params = useParams<{ id: string }>();
  const id = isEdit ? parseInt(params.id ?? "0") : 0;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { isError: noStore, isLoading: storeLoading } = useGetMyStore();
  const { data: existing, isLoading: loadingProduct } = useGetProduct(id, {
    query: { enabled: isEdit && !!id, queryKey: getGetProductQueryKey(id) }
  });
  const { data: categories } = useListCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [form, setForm] = useState<ProductFormValues>(defaultForm);

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        description: existing.description ?? "",
        price: String(existing.price),
        imageUrl: existing.imageUrl ?? "",
        category: existing.category ?? "",
        stock: existing.stock != null ? String(existing.stock) : "",
        isAvailable: existing.isAvailable,
      });
    }
  }, [existing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast({ title: "Name and price are required", variant: "destructive" });
      return;
    }
    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      imageUrl: form.imageUrl || null,
      category: form.category || null,
      stock: form.stock ? parseInt(form.stock) : null,
      isAvailable: form.isAvailable,
    };
    try {
      if (isEdit) {
        await updateProduct.mutateAsync({ id, data: payload });
        queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(id) });
      } else {
        await createProduct.mutateAsync({ data: payload });
      }
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      toast({ title: `Product ${isEdit ? "updated" : "created"} successfully` });
      setLocation("/products");
    } catch {
      toast({ title: `Failed to ${isEdit ? "update" : "create"} product`, variant: "destructive" });
    }
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  if (!storeLoading && noStore) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Store className="w-14 h-14 text-muted-foreground/40 mb-4" />
          <h2 className="text-xl font-bold mb-2">No store yet</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs">
            You need to create your store before adding products. It only takes a minute!
          </p>
          <Link href="/onboarding">
            <Button className="gap-2">Create Your Store</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl" data-testid="product-form-page">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/products")} className="shrink-0" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{isEdit ? "Edit Product" : "Add Product"}</h1>
          </div>
        </div>

        {isEdit && loadingProduct ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" data-testid="input-product-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Handmade Silver Ring" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input id="price" data-testid="input-price" type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock (optional)</Label>
                <Input id="stock" data-testid="input-stock" type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="Leave empty for unlimited" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  data-testid="select-category"
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">No category</option>
                  {categories?.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input id="imageUrl" data-testid="input-image-url" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" data-testid="input-description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe your product..." rows={3} className="resize-none" />
              </div>
              <div className="flex items-center justify-between sm:col-span-2 py-2">
                <div>
                  <Label htmlFor="available">Available for sale</Label>
                  <p className="text-xs text-muted-foreground">Hidden products won't show on your storefront</p>
                </div>
                <Switch id="available" data-testid="switch-available" checked={form.isAvailable} onCheckedChange={v => setForm(f => ({ ...f, isAvailable: v }))} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setLocation("/products")} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={isPending} className="flex-1 gap-2" data-testid="button-submit">
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEdit ? "Save Changes" : "Add Product"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
