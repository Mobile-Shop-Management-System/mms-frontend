"use client";

import { useShopSettings } from "@/hooks/useSettings";

export function InvoiceTemplate({ invoiceNumber, date, customer, items, total, paymentMethod, notes }) {
  const { data: settings, isLoading, error } = useShopSettings();

  const shopData = settings || {
    name: 'Mobile Shop POS',
    description: 'Your Trusted Phone Store',
    logo_url: null,
    address: '',
    city: '',
    country: '',
    phone: '',
    email: '',
    website: '',
    tax_id: ''
  };

  return (
    <div className="w-full bg-white" style={{ fontFamily: "'Courier New', monospace" }}>
      {/* Header Section */}
      <div className="mb-6 pb-4 border-b-2 border-black">
        <div className="flex justify-between items-start mb-6">
          {/* Left Side - Logo & Shop Info */}
          <div className="flex-1">
            {shopData.logo_url && (
              <img
                src={shopData.logo_url}
                alt={shopData.name}
                className="h-20 mb-3"
                style={{ maxWidth: "120px" }}
              />
            )}
            <div>
              <h1 className="text-2xl font-black mb-1">{shopData.name}</h1>
              {shopData.description && (
                <p className="text-sm text-gray-600">{shopData.description}</p>
              )}
            </div>
          </div>

          {/* Right Side - INVOICE */}
          <div className="text-right">
            <h2 className="text-4xl font-black mb-2">INVOICE</h2>
            {invoiceNumber && <p className="text-sm text-gray-600">INV-{invoiceNumber}</p>}
          </div>
        </div>

        {/* Shop Details Under Header */}
        <div className="text-xs text-gray-700 space-y-0.5 mb-4">
          {shopData.address && <p>{shopData.address}</p>}
          {(shopData.city || shopData.country) && (
            <p>{[shopData.city, shopData.country].filter(Boolean).join(", ")}</p>
          )}
          {shopData.phone && <p>Tel: {shopData.phone}</p>}
          {shopData.email && <p>Email: {shopData.email}</p>}
          {shopData.website && <p>Web: {shopData.website}</p>}
          {shopData.tax_id && <p>Tax ID: {shopData.tax_id}</p>}
        </div>
      </div>

      {/* Bill To & Date/Payment Section */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        {/* Bill To */}
        {customer && (
          <div>
            <p className="text-xs font-bold text-gray-600 mb-1">BILL TO</p>
            <div className="text-sm border border-gray-300 p-3 rounded">
              <p className="font-bold">{customer.name}</p>
              {customer.phone && <p className="text-gray-600">{customer.phone}</p>}
              {customer.address && <p className="text-gray-600 text-xs">{customer.address}</p>}
            </div>
          </div>
        )}

        {/* Date & Time */}
        <div>
          <p className="text-xs font-bold text-gray-600 mb-1">DATE & TIME</p>
          <div className="text-sm border border-gray-300 p-3 rounded">
            {date && <p className="font-bold">{date}</p>}
            {paymentMethod && <p className="text-gray-600">Payment: {paymentMethod}</p>}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-4">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-black text-white">
              <th className="border border-black p-2 text-left w-8">#</th>
              <th className="border border-black p-2 text-left flex-1">ITEM DESCRIPTION</th>
              <th className="border border-black p-2 text-center w-16">QTY</th>
              <th className="border border-black p-2 text-right w-24">UNIT PRICE</th>
              <th className="border border-black p-2 text-right w-24">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {items && items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-300">
                <td className="border-l border-gray-300 p-2 text-center">{idx + 1}</td>
                <td className="border-l border-gray-300 p-2">{item.name}</td>
                <td className="border-l border-gray-300 p-2 text-center">{item.quantity}</td>
                <td className="border-l border-gray-300 p-2 text-right">
                  PKR<br />{item.price?.toLocaleString("en-PK", { minimumFractionDigits: 0 })}
                </td>
                <td className="border-l border-gray-300 p-2 text-right">
                  PKR<br />{(item.quantity * item.price)?.toLocaleString("en-PK", { minimumFractionDigits: 0 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total Section */}
      <div className="mb-6 flex justify-end">
        <div className="w-64 bg-black text-white p-3 flex justify-between text-sm font-bold">
          <span>Total</span>
          <span>PKR {total?.toLocaleString("en-PK", { minimumFractionDigits: 0 })}</span>
        </div>
      </div>

      {/* Footer Message */}
      <div className="text-center text-xs border-t border-dashed border-gray-400 pt-4 text-gray-600">
        <p>Thank you for your business · Please visit us again</p>
      </div>

      {/* Notes */}
      {notes && (
        <div className="text-xs mt-6 pt-4 border-t border-gray-300 text-gray-600">
          <p className="font-bold mb-2">Notes:</p>
          <p>{notes}</p>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            font-family: 'Courier New', monospace;
          }
          * {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
