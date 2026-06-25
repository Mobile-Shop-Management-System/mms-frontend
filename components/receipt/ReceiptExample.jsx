"use client";

import { InvoiceTemplate } from "./InvoiceTemplate";

// Example usage of the receipt/invoice template
export function ReceiptExample() {
  const mockInvoice = {
    invoiceNumber: "20260623-002",
    date: "23-Jun-2026, 03:36 pm",
    customer: {
      name: "Zeeshan Khan",
      phone: "2034242",
      address: "House 123, Street 45, City",
    },
    items: [
      {
        name: "Sharp Aquas R5 (Used)",
        quantity: 1,
        price: 16000,
      },
      {
        name: "Screen Protector",
        quantity: 2,
        price: 500,
      },
      {
        name: "Phone Case",
        quantity: 1,
        price: 1500,
      },
    ],
    total: 18500,
    paymentMethod: "Cash",
    notes: "Thank you for purchasing from us!",
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex gap-3">
        <button
          onClick={handlePrint}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          Print Receipt
        </button>
      </div>

      <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 overflow-x-auto">
        <InvoiceTemplate
          invoiceNumber={mockInvoice.invoiceNumber}
          date={mockInvoice.date}
          customer={mockInvoice.customer}
          items={mockInvoice.items}
          total={mockInvoice.total}
          paymentMethod={mockInvoice.paymentMethod}
          notes={mockInvoice.notes}
        />
      </div>
    </div>
  );
}
