"use client";

import { useState, useEffect, useRef } from "react";
import { useShopSettings, useUpdateShopSettingsMutation } from "@/hooks/useSettings";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Pencil, X, Store, Mail, Phone, Globe, FileText, MapPin, Building2 } from "lucide-react";

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  website: "",
  tax_id: "",
  address: "",
  city: "",
  country: "",
  description: "",
};

function Field({ label, icon: Icon, error, required, textarea: Textarea = false, ...props }) {
  const Component = Textarea ? "textarea" : "input";
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        )}
        <Component
          {...props}
          className={cn(
            "w-full rounded-lg border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-all",
            Icon ? "pl-10 pr-3" : "px-3",
            Textarea ? "py-3 min-h-24 resize-none" : "h-10 py-2",
            error
              ? "border-destructive focus:ring-destructive/30 focus:border-destructive"
              : "border-border focus:ring-ring/50 focus:border-primary"
          )}
        />
      </div>
      {error && <p className="text-xs text-destructive font-medium">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, fallback = "—" }) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 p-2 rounded-lg bg-primary/10 shrink-0">
        <Icon className="size-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        <p className={cn("text-sm font-medium", !value && "text-muted-foreground italic")}>
          {value || fallback}
        </p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { data: settings, isLoading } = useShopSettings();
  const { mutateAsync: updateSettings, isPending } = useUpdateShopSettingsMutation();

  const fileInputRef = useRef(null);
  const [isEditing, setEditing] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [logoPreview, setLogoPreview] = useState("");

  useEffect(() => {
    if (settings) {
      const formData = {
        name: settings.name ?? "",
        email: settings.email ?? "",
        phone: settings.phone ?? "",
        website: settings.website ?? "",
        tax_id: settings.tax_id ?? "",
        address: settings.address ?? "",
        city: settings.city ?? "",
        country: settings.country ?? "",
        description: settings.description ?? "",
      };
      setForm(formData);
      if (settings.logo_url) {
        setLogoPreview(settings.logo_url);
      }
    }
  }, [settings]);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result);
      setForm((f) => ({ ...f, logo: file }));
    };
    reader.readAsDataURL(file);
  };

  const cancel = () => {
    setEditing(false);
    setErrors({});
    if (settings) {
      setForm({
        name: settings.name ?? "",
        email: settings.email ?? "",
        phone: settings.phone ?? "",
        website: settings.website ?? "",
        tax_id: settings.tax_id ?? "",
        address: settings.address ?? "",
        city: settings.city ?? "",
        country: settings.country ?? "",
        description: settings.description ?? "",
      });
      setLogoPreview(settings.logo_url ?? "");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!form.name?.trim()) {
      setErrors({ name: "Shop name is required" });
      return;
    }

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, value);
        }
      });

      await updateSettings(formData);
      toast.success("Settings saved successfully");
      setEditing(false);
    } catch (err) {
      const errs = err?.response?.data?.errors;
      if (errs) {
        setErrors(errs);
      } else {
        toast.error(err?.response?.data?.message ?? "Failed to save settings");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-64 rounded-lg mb-2" />
          <Skeleton className="h-5 w-96 rounded-lg mt-3" />
        </div>
        <div className="grid gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Shop Settings</h1>
          <p className="text-muted-foreground mt-2">Configure your shop details and branding</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setEditing(true)} size="lg" className="gap-2">
            <Pencil className="size-4" />
            Edit Details
          </Button>
        )}
      </div>

      {/* Logo & Brand Section */}
      <div className="rounded-2xl border border-border/50 bg-linear-to-br from-card to-card/50 backdrop-blur-sm overflow-hidden hover:border-border transition-colors">
        <div className="px-8 py-6 border-b border-border/30">
          <h2 className="text-lg font-semibold text-foreground">Shop Branding</h2>
          <p className="text-sm text-muted-foreground mt-1">Logo and visual identity</p>
        </div>

        <div className="p-8">
          {!isEditing ? (
            <div className="flex items-center gap-8">
              <div className="shrink-0">
                {logoPreview ? (
                  <div className="relative group">
                    <img
                      src={logoPreview}
                      alt="Shop logo"
                      className="h-48 w-48 rounded-2xl object-cover border-2 border-border shadow-lg"
                    />
                  </div>
                ) : (
                  <div className="h-48 w-48 rounded-2xl border-2 border-dashed border-border/50 bg-muted/30 flex items-center justify-center flex-col gap-2">
                    <Store className="size-8 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground text-center">No logo uploaded</p>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-4">
                  Your shop logo will appear on all receipts and reports
                </p>
                <Button onClick={() => setEditing(true)} variant="outline" size="lg" className="gap-2">
                  <Upload className="size-4" />
                  Upload Logo
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-8">
              <div className="shrink-0">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Shop logo"
                    className="h-48 w-48 rounded-2xl object-cover border-2 border-border shadow-lg"
                  />
                ) : (
                  <div className="h-48 w-48 rounded-2xl border-2 border-dashed border-border/50 bg-muted/30 flex items-center justify-center flex-col gap-2">
                    <Store className="size-8 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground text-center">No logo</p>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-dashed border-border/50 hover:border-primary bg-background hover:bg-muted text-sm font-medium transition-all duration-200"
                >
                  <Upload className="size-4" />
                  Choose Image
                </button>
                <p className="text-xs text-muted-foreground mt-4">JPG, PNG, or WebP • Max 5 MB</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shop Information */}
      <div className="rounded-2xl border border-border/50 bg-linear-to-br from-card to-card/50 backdrop-blur-sm overflow-hidden hover:border-border transition-colors">
        <div className="px-8 py-6 border-b border-border/30">
          <h2 className="text-lg font-semibold text-foreground">Shop Information</h2>
          <p className="text-sm text-muted-foreground mt-1">Business details and contact information</p>
        </div>

        <div className="p-8">
          {!isEditing ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoItem icon={Store} label="Shop Name" value={settings?.name} />
                <InfoItem icon={FileText} label="Tax ID / NTN" value={settings?.tax_id} />
                <InfoItem icon={Mail} label="Email Address" value={settings?.email} />
                <InfoItem icon={Phone} label="Phone Number" value={settings?.phone} />
                <InfoItem icon={Globe} label="Website" value={settings?.website} />
                <InfoItem icon={Building2} label="City" value={settings?.city} />
              </div>
              <div>
                <InfoItem icon={MapPin} label="Address" value={settings?.address} />
              </div>
              {settings?.description && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</p>
                  <p className="text-sm text-foreground leading-relaxed">{settings.description}</p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field
                  label="Shop Name"
                  name="name"
                  icon={Store}
                  value={form.name}
                  onChange={handleFieldChange}
                  placeholder="Enter shop name"
                  error={errors.name}
                  required
                />
                <Field
                  label="Tax ID / NTN"
                  name="tax_id"
                  icon={FileText}
                  value={form.tax_id}
                  onChange={handleFieldChange}
                  placeholder="Enter tax ID"
                  error={errors.tax_id}
                />
                <Field
                  label="Email Address"
                  name="email"
                  type="email"
                  icon={Mail}
                  value={form.email}
                  onChange={handleFieldChange}
                  placeholder="shop@example.com"
                  error={errors.email}
                />
                <Field
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  icon={Phone}
                  value={form.phone}
                  onChange={handleFieldChange}
                  placeholder="+92 300 0000000"
                  error={errors.phone}
                />
                <Field
                  label="Website"
                  name="website"
                  type="url"
                  icon={Globe}
                  value={form.website}
                  onChange={handleFieldChange}
                  placeholder="https://example.com"
                  error={errors.website}
                />
                <Field
                  label="City"
                  name="city"
                  icon={Building2}
                  value={form.city}
                  onChange={handleFieldChange}
                  placeholder="City name"
                  error={errors.city}
                />
              </div>

              <Field
                label="Street Address"
                name="address"
                icon={MapPin}
                value={form.address}
                onChange={handleFieldChange}
                placeholder="Enter full address"
                textarea
                error={errors.address}
              />

              <Field
                label="Country"
                name="country"
                icon={Globe}
                value={form.country}
                onChange={handleFieldChange}
                placeholder="Country name"
                error={errors.country}
              />

              <Field
                label="Description"
                name="description"
                value={form.description}
                onChange={handleFieldChange}
                placeholder="Brief description of your shop"
                textarea
                error={errors.description}
              />

              <div className="flex gap-3 pt-4">
                <Button type="submit" size="lg" disabled={isPending} className="gap-2">
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" size="lg" onClick={cancel} disabled={isPending}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
