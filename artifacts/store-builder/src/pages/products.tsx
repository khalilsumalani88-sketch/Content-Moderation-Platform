import DashboardLayout from "@/components/layout";
import { useListProducts, useDeleteProduct, useListCategories, useGetMyStore, getListProductsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2, Package, Image, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Products() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const { data: store, isLoading: storeLoading, isError: noStore } = useGetMyStore();
  const { data: products, isLoading } = useListProducts(
    store ? (search || category ? { search: search || undefined, category: category || undefined } : undefined) : undefined,
    { query: { enabled: !!store } as any }
  );
  const { data: categories } = useListCategories({ query: { enabled: !!store } as any });
  const deleteProduct = useDeleteProduct();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const currency = store?.currency ?? "USD";

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await deleteProduct.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      toast({ title: "Product deleted" });
    } catch {
      toast({ title: "Failed to delete product", variant: "destructive" });
    }
  };

  if (!storeLoading && noStore) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Store className="w-14 h-14 text-muted-foreground/40 mb-4" />
          <h2 className="text-xl font-bold mb-2">No store yet</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs">You need to create your store before adding products. It only takes a minute!</p>
          <Link href="/onboarding">
            <Button className="gap-2"><Plus className="w-4 h-4" /> Create Your Store</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div data-testid="products-page">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground text-sm mt-1">{products?.length ?? 0} products in your store</p>
          </div>
          <Link href="/products/new">
            <Button className="gap-2" data-testid="button-add-product">
              <Plus className="w-4 h-4" /> Add Product
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-products"
            />
          </div>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            data-testid="select-category-filter"
          >
            <option value="">All Categories</option>
            {categories?.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-52 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : !products || products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <h3 className="font-semibold text-foreground mb-1">No products yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Add your first product to start selling</p>
            <Link href="/products/new">
              <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add Product</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map(product => (
              <div key={product.id} className="bg-card border border-border rounded-xl overflow-hidden group" data-testid={`card-product-${product.id}`}>
                <div className="h-36 bg-muted flex items-center justify-center relative overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                  ) : (
                    <Image className="w-8 h-8 text-muted-foreground/30" />
                  )}
                  <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/products/${product.id}/edit`}>
                      <Button size="icon" variant="secondary" className="w-7 h-7" data-testid={`button-edit-product-${product.id}`}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="w-7 h-7"
                      onClick={() => handleDelete(product.id, product.name)}
                      data-testid={`button-delete-product-${product.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm truncate" data-testid={`text-product-name-${product.id}`}>{product.name}</p>
                  {product.category && <p className="text-xs text-muted-foreground mt-0.5">{product.category}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-primary text-sm" data-testid={`text-price-${product.id}`}>{currency} {Number(product.price).toFixed(2)}</span>
                    <Badge variant={product.isAvailable ? "default" : "secondary"} className="text-xs">
                      {product.isAvailable ? "Active" : "Hidden"}
                    </Badge>
                  </div>
                  {product.stock !== null && product.stock !== undefined && (
                    <p className="text-xs text-muted-foreground mt-1">Stock: {product.stock}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
