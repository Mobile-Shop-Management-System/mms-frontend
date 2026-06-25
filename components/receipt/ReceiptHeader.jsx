"use client";

import { useShopSettings } from "@/hooks/useSettings";

export function ReceiptHeader() {
  const { data: settings, isLoading } = useShopSettings();

  if (isLoading || !settings) {
    return null;
  }

  return (
    <div className="receipt-header print:w-full" style={{ maxWidth: "80mm" }}>
      {/* Logo & Shop Name */}
      <div className="text-center mb-4 border-b border-gray-400 pb-3">
        {settings.logo_url && (
          <img
            src={settings.logo_url}
            alt={settings.name}
            className="h-16 mx-auto mb-2 print:h-16"
            style={{ maxWidth: "70mm" }}
          />
        )}
        <h1 className="text-xl font-bold tracking-wide print:text-lg">{settings.name}</h1>
        {settings.description && (
          <p className="text-xs text-gray-600 mt-1 print:text-xs">{settings.description}</p>
        )}
      </div>

      {/* Shop Details */}
      <div className="text-center text-xs mb-3 pb-3 border-b border-gray-400 print:text-xs space-y-1">
        {settings.address && (
          <p className="text-gray-700 print:text-gray-700">{settings.address}</p>
        )}
        {(settings.city || settings.country) && (
          <p className="text-gray-700 print:text-gray-700">
            {[settings.city, settings.country].filter(Boolean).join(", ")}
          </p>
        )}
        {settings.phone && (
          <p className="text-gray-700 print:text-gray-700">Tel: {settings.phone}</p>
        )}
        {settings.email && (
          <p className="text-gray-700 print:text-gray-700">Email: {settings.email}</p>
        )}
        {settings.website && (
          <p className="text-gray-700 print:text-gray-700">Web: {settings.website}</p>
        )}
        {settings.tax_id && (
          <p className="text-gray-700 print:text-gray-700">Tax ID: {settings.tax_id}</p>
        )}
      </div>
    </div>
  );
}
