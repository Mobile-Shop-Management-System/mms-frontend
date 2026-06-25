"use client";

import { useState } from "react";
import { useKhataList, usePendingKhata, usePaidKhata, useAddKhataPaymentMutation } from "@/hooks/useKhata";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Phone, MapPin, DollarSign, Clock } from "lucide-react";

const STATUS_COLORS = {
  pending: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  partially_paid: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const STATUS_LABELS = {
  pending: "Pending",
  partially_paid: "Partially Paid",
  paid: "Paid",
};

function KhataDetailDialog({ khata, open, onOpenChange, onPaymentAdded }) {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const { mutate: addPayment, isPending } = useAddKhataPaymentMutation();

  const handleAddPayment = () => {
    const amount = Number(paymentAmount);

    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    if (amount > khata.remaining_amount) {
      toast.error(`Amount exceeds remaining PKR ${khata.remaining_amount}`);
      return;
    }

    addPayment(
      { id: khata.id, data: { amount, payment_method: paymentMethod, notes } },
      {
        onSuccess: (response) => {
          toast.success("Payment recorded successfully!");
          setPaymentAmount("");
          setPaymentMethod("cash");
          setNotes("");
          onPaymentAdded(response.data);
        },
        onError: (err) => {
          toast.error(err.response?.data?.error ?? "Failed to add payment");
        },
      }
    );
  };

  if (!khata) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Khata Details</DialogTitle>
          <DialogDescription>{khata.customer_name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer Info */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="text-sm font-medium">Name:</div>
              <div className="text-sm text-muted-foreground">{khata.customer_name}</div>
            </div>
            {khata.customer_phone && (
              <div className="flex items-start gap-3">
                <Phone className="size-4 mt-0.5 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">{khata.customer_phone}</div>
              </div>
            )}
            {khata.customer_address && (
              <div className="flex items-start gap-3">
                <MapPin className="size-4 mt-0.5 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">{khata.customer_address}</div>
              </div>
            )}
          </div>

          {/* Amount Info */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="text-xs font-semibold text-muted-foreground mb-1">TOTAL</div>
              <div className="text-lg font-bold">PKR {Number(khata.total_amount).toLocaleString()}</div>
            </div>
            <div className="rounded-lg border border-border bg-green-50 dark:bg-green-900/20 p-3">
              <div className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">PAID</div>
              <div className="text-lg font-bold text-green-700 dark:text-green-400">PKR {Number(khata.paid_amount).toLocaleString()}</div>
            </div>
            <div className="rounded-lg border border-border bg-red-50 dark:bg-red-900/20 p-3">
              <div className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">REMAINING</div>
              <div className="text-lg font-bold text-red-700 dark:text-red-400">PKR {Number(khata.remaining_amount).toLocaleString()}</div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <Badge className={STATUS_COLORS[khata.status]}>
              {STATUS_LABELS[khata.status]}
            </Badge>
          </div>

          {/* Payment History */}
          {khata.payments && khata.payments.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3">Payment History</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {khata.payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-start p-2 bg-muted/50 rounded-lg text-xs">
                    <div>
                      <div className="font-medium">PKR {Number(payment.amount).toLocaleString()}</div>
                      <div className="text-muted-foreground">{payment.payment_method}</div>
                    </div>
                    <div className="text-muted-foreground">
                      {new Date(payment.created_at).toLocaleDateString("en-PK")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Payment Section */}
          {khata.remaining_amount > 0 && (
            <div className="border-t pt-4 space-y-3">
              <h4 className="text-sm font-semibold">Record Payment</h4>

              <div className="space-y-2">
                <label className="block text-xs font-medium">Amount to Pay (PKR)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`Max: ${khata.remaining_amount}`}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="easypaisa">Easypaisa</option>
                  <option value="jazzcash">JazzCash</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm min-h-16 resize-none"
                />
              </div>

              <Button
                onClick={handleAddPayment}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? "Recording..." : "Record Payment"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function KhataManager() {
  const [selectedTab, setSelectedTab] = useState("pending");
  const [selectedKhata, setSelectedKhata] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const { data: pendingKhatas, isLoading: pendingLoading } = usePendingKhata();
  const { data: paidKhatas, isLoading: paidLoading } = usePaidKhata();

  const khatas = selectedTab === "pending" ? pendingKhatas : paidKhatas;
  const isLoading = selectedTab === "pending" ? pendingLoading : paidLoading;

  const handleOpenDetail = (khata) => {
    setSelectedKhata(khata);
    setDetailDialogOpen(true);
  };

  const handlePaymentAdded = (updatedKhata) => {
    setSelectedKhata(updatedKhata);
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setSelectedTab("pending")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            selectedTab === "pending"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setSelectedTab("paid")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            selectedTab === "paid"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Paid
        </button>
      </div>

      {/* Khatas List */}
      <div className="rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : khatas && khatas.length > 0 ? (
          <div className="divide-y divide-border">
            {khatas.map((khata) => (
              <div
                key={khata.id}
                onClick={() => handleOpenDetail(khata)}
                className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold">{khata.customer_name}</div>
                    {khata.customer_phone && (
                      <div className="text-xs text-muted-foreground">{khata.customer_phone}</div>
                    )}
                  </div>
                  <Badge className={STATUS_COLORS[khata.status]}>
                    {STATUS_LABELS[khata.status]}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className="font-medium">PKR {Number(khata.total_amount).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Paid</div>
                    <div className="font-medium text-green-600">PKR {Number(khata.paid_amount).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Remaining</div>
                    <div className="font-medium text-red-600">PKR {Number(khata.remaining_amount).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No {selectedTab} khatas found
          </div>
        )}
      </div>

      <KhataDetailDialog
        khata={selectedKhata}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onPaymentAdded={handlePaymentAdded}
      />
    </div>
  );
}
