import DashboardLayout from "@/components/layout";
import { useGetMyStore, useUpdateMyStore, useListCategories, useCreateCategory, useDeleteCategory, getGetMyStoreQueryKey, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X, ExternalLink } from "lucide-react";

export default function Settings() {
  const { data: store, isLoading } = useGetMyStore();
  const { data: categories } = useListCategories();
  const updateStore = useUpdateMyStore();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    description: "",
    whatsappNumber: "",
    currency: "",
    theme: "light",
    logoUrl: "",
    bannerUrl: "",
  });
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    if (store) {
      setForm({
        name: store.name,
        description: store.description ?? "",
        whatsappNumber: store.whatsappNumber,
        currency: store.currency,
        theme: store.theme,
        logoUrl: store.logoUrl ?? "",
        bannerUrl: store.bannerUrl ?? "",
      });
    }
  }, [store]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateStore.mutateAsync({
        data: {
          ...form,
          description: form.description || null,
          logoUrl: form.logoUrl || null,
          bannerUrl: form.bannerUrl || null,
        }
      });
      queryClient.invalidateQueries({ queryKey: getGetMyStoreQueryKey() });
      toast({ title: "Settings saved successfully" });
    } catch {
      toast({ title: "Failed to save settings", variant: "destructive" });
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await createCategory.mutateAsync({ data: { name: newCategory.trim() } });
      queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
      setNewCategory("");
      toast({ title: "Category added" });
    } catch {
      toast({ title: "Failed to add category", variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (id: number, name: string) => {
    try {
      await deleteCategory.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
      toast({ title: `Category "${name}" deleted` });
    } catch {
      toast({ title: "Failed to delete category", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl" data-testid="settings-page">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Store Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your store configuration</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !store ? (
          <div className="text-center py-20 text-muted-foreground">Store not found</div>
        ) : (
          <div className="space-y-6">
            <form onSubmit={handleSave} className="bg-card border border-border rounded-xl p-6 space-y-5">
              <h2 className="text-base font-semibold">General</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Store Name</Label>
                  <Input id="name" data-testid="input-store-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp Number</Label>
                  <Input id="whatsapp" data-testid="input-whatsapp" value={form.whatsappNumber} onChange={e => setForm(f => ({ ...f, whatsappNumber: e.target.value }))} placeholder="+1234567890" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input id="currency" data-testid="input-currency" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value.toUpperCase() }))} maxLength={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <select
                    id="theme"
                    data-testid="select-theme"
                    value={form.theme}
                    onChange={e => setForm(f => ({ ...f, theme: e.target.value }))}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" data-testid="input-description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="resize-none" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input id="logoUrl" data-testid="input-logo-url" value={form.logoUrl} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bannerUrl">Banner URL</Label>
                  <Input id="bannerUrl" data-testid="input-banner-url" value={form.bannerUrl} onChange={e => setForm(f => ({ ...f, bannerUrl: e.target.value }))} placeholder="https://..." />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <a
                  href={`/store/${store.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                  data-testid="link-view-storefront"
                >
                  View Storefront <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <Button type="submit" disabled={updateStore.isPending} className="gap-2" data-testid="button-save-settings">
                  {updateStore.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Settings
                </Button>
              </div>
            </form>

            {/* Categories */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-base font-semibold mb-4">Categories</h2>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="New category name..."
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddCategory())}
                  data-testid="input-new-category"
                />
                <Button onClick={handleAddCategory} disabled={createCategory.isPending} className="gap-2 shrink-0" data-testid="button-add-category">
                  {createCategory.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add
                </Button>
              </div>
              {!categories || categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">No categories yet. Add some to organize your products.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center gap-1.5 bg-secondary text-secondary-foreground rounded-full px-3 py-1.5 text-sm" data-testid={`category-${cat.id}`}>
                      <span>{cat.name}</span>
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        data-testid={`button-delete-category-${cat.id}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
