"use client";

import { useState } from "react";
import { Building2, Eye, EyeOff, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const EMPTY_FORM = {
  name: "",
  slug: "",
  admin_first_name: "",
  admin_last_name: "",
  admin_email: "",
  admin_username: "",
  admin_password: "",
};

export function CreateShopDialog({ onClose, onSubmit, isProcessing }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const setField = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleNameChange = (event) => {
    const name = event.target.value;
    setForm((current) => ({
      ...current,
      name,
      slug: current.slug ? current.slug : slugify(name),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    onSubmit(form, { onError: setError });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="sticky top-0 bg-background border-b border-border/40 flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="size-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold leading-tight">
                Create New Shop
              </h2>
              <p className="text-xs text-muted-foreground">
                A Shop Admin account is created with this shop.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Shop Details
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="shop-name">Shop Name *</Label>
              <Input
                id="shop-name"
                value={form.name}
                onChange={handleNameChange}
                placeholder="City Mobile"
                disabled={isProcessing}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shop-slug">Shop Identifier *</Label>
              <Input
                id="shop-slug"
                value={form.slug}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    slug: slugify(event.target.value),
                  }))
                }
                placeholder="city-mobile"
                disabled={isProcessing}
                required
              />
              <p className="text-xs text-muted-foreground">
                Must be unique. Used internally to identify this shop.
              </p>
            </div>
          </div>

          <div className="space-y-3 border-t border-border/40 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Shop Admin Account
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="admin-first-name">First Name</Label>
                <Input
                  id="admin-first-name"
                  value={form.admin_first_name}
                  onChange={setField("admin_first_name")}
                  placeholder="Ayesha"
                  disabled={isProcessing}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-last-name">Last Name</Label>
                <Input
                  id="admin-last-name"
                  value={form.admin_last_name}
                  onChange={setField("admin_last_name")}
                  placeholder="Khan"
                  disabled={isProcessing}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={form.admin_email}
                onChange={setField("admin_email")}
                placeholder="admin@shop.com"
                disabled={isProcessing}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-username">Username *</Label>
              <Input
                id="admin-username"
                value={form.admin_username}
                onChange={setField("admin_username")}
                placeholder="shop_admin"
                disabled={isProcessing}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Password *</Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={form.admin_password}
                  onChange={setField("admin_password")}
                  placeholder="••••••••"
                  minLength={8}
                  disabled={isProcessing}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((visible) => !visible)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters.
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1" disabled={isProcessing}>
              {isProcessing && <Loader2 className="size-4 mr-2 animate-spin" />}
              Create Shop
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
