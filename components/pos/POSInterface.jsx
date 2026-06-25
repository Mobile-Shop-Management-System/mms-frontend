"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle, Package, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useItemDropdown } from "@/hooks/useItems";
import { useCreateSaleMutation } from "@/hooks/useSales";
import { printReceipt } from "@/lib/printReceipt";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "easypaisa", label: "Easypaisa" },
  { value: "jazzcash", label: "JazzCash" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

function ItemCard({ item, onAdd }) {
  const outOfStock = item.quantity_in_stock <= 0;

  return (
    <button
      onClick={() => !outOfStock && onAdd(item)}
      disabled={outOfStock}
      className={cn(
        "relative w-full text-left rounded-xl border p-3 transition-all",
        outOfStock
          ? "border-border/40 bg-muted/30 opacity-60 cursor-not-allowed"
          : "border-border bg-card hover:border-primary/50 hover:shadow-sm cursor-pointer active:scale-[0.98]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground leading-tight truncate">{item.name}</p>
          {item.category_name && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.category_name}</p>
          )}
          {item.variants?.length > 0 && (
            <span className="text-[10px] text-muted-foreground mt-0.5">{item.variants.length} variants</span>
          )}
        </div>
        <div className="shrink-0">
          {outOfStock ? (
            <span className="inline-flex items-center rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
              Out of Stock
            </span>
          ) : (
            <div className="size-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Plus className="size-3" />
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-bold text-foreground">
          PKR {Number(item.selling_price).toLocaleString()}
        </span>
        <span className={cn(
          "text-xs font-medium",
          item.quantity_in_stock <= 5 ? "text-orange-500" : "text-muted-foreground"
        )}>
          Qty: {item.quantity_in_stock}
        </span>
      </div>
    </button>
  );
}

function VariantPickerDialog({ item, onClose, onSelect }) {
  if (!item) return null;
  const availableVariants = item.variants.filter((v) => v.quantity_in_stock > 0);
  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Select Variant</DialogTitle>
          <DialogDescription>{item.name} — choose a variant to add to cart</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {availableVariants.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">All variants are out of stock.</p>
          ) : (
            availableVariants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => onSelect(item, variant)}
                className="w-full flex items-center justify-between rounded-lg border border-border bg-card hover:bg-muted px-4 py-3 text-sm transition-colors"
              >
                <span className="font-medium">{variant.name}</span>
                <div className="flex items-center gap-3 text-right">
                  <span className="text-muted-foreground text-xs">Qty: {variant.quantity_in_stock}</span>
                  <span className="font-bold">
                    PKR {Number(variant.selling_price ?? item.selling_price).toLocaleString()}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CartItem({ entry, onChangeQty, onRemove }) {
  const lineTotal = entry.quantity * Number(entry.unit_price);
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/40 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{entry.item_name}</p>
        <p className="text-xs text-muted-foreground">
          PKR {Number(entry.unit_price).toLocaleString()} each
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onChangeQty(entry.cart_key, entry.quantity - 1)}
          className="size-6 flex items-center justify-center rounded-md border border-border bg-background hover:bg-muted text-muted-foreground transition-colors"
        >
          <Minus className="size-3" />
        </button>
        <span className="w-7 text-center text-sm font-semibold">{entry.quantity}</span>
        <button
          onClick={() => onChangeQty(entry.cart_key, entry.quantity + 1)}
          className="size-6 flex items-center justify-center rounded-md border border-border bg-background hover:bg-muted text-muted-foreground transition-colors"
        >
          <Plus className="size-3" />
        </button>
      </div>
      <div className="shrink-0 w-20 text-right">
        <p className="text-sm font-bold">PKR {lineTotal.toLocaleString()}</p>
      </div>
      <button
        onClick={() => onRemove(entry.cart_key)}
        className="shrink-0 size-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

function ReceiptDialog({ open, onOpenChange, receiptData, onNewSale }) {
  if (!receiptData) return null;
  const { sale, cartSnapshot } = receiptData;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="size-5" /> Sale Complete!
          </DialogTitle>
          <DialogDescription>
            Invoice #{sale?.invoice_number ?? sale?.id} has been recorded.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {sale?.customer_name && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</p>
              <p className="text-sm font-medium mt-0.5">{sale.customer_name}</p>
              {sale.customer_phone && <p className="text-xs text-muted-foreground">{sale.customer_phone}</p>}
            </div>
          )}

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Item</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Qty</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {cartSnapshot.map((entry, i) => (
                  <tr key={i} className="border-b border-border/40 last:border-0">
                    <td className="px-3 py-2">{entry.item_name}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{entry.quantity}</td>
                    <td className="px-3 py-2 text-right font-semibold">
                      PKR {(entry.quantity * Number(entry.unit_price)).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
            {sale?.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-green-600">- PKR {Number(sale.discount).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>PKR {Number(sale?.total ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Payment</span>
              <span>{PAYMENT_METHODS.find((m) => m.value === sale?.payment_method)?.label ?? sale?.payment_method ?? "—"}</span>
            </div>
          </div>

          {/* Payment Details Section */}
          {sale && (
            <div className={`rounded-lg border-2 p-3 space-y-2 ${
              sale.khata && sale.khata.remaining_amount > 0
                ? "border-orange-300 bg-orange-50 dark:bg-orange-900/20"
                : "border-green-300 bg-green-50 dark:bg-green-900/20"
            }`}>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300">Payment Details</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  sale.khata && sale.khata.remaining_amount > 0
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                    : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                }`}>
                  {sale.khata && sale.khata.remaining_amount > 0 ? "Khata Pending" : "Paid"}
                </span>
              </div>

              <div className="flex justify-between text-sm border-b border-border pb-1.5">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-semibold">PKR {Number(sale.total).toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-green-700 dark:text-green-400 font-medium">Paid Amount</span>
                <span className="font-semibold text-green-700 dark:text-green-400">
                  PKR {sale.khata ? Number(sale.khata.paid_amount).toLocaleString() : Number(sale.total).toLocaleString()}
                </span>
              </div>

              {sale.khata && sale.khata.remaining_amount > 0 && (
                <div className="flex justify-between text-sm bg-orange-100 dark:bg-orange-900/40 p-1.5 rounded">
                  <span className="font-bold text-orange-700 dark:text-orange-400">Remaining Amount</span>
                  <span className="font-bold text-orange-700 dark:text-orange-400">
                    PKR {Number(sale.khata.remaining_amount).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => printReceipt(sale)}
            >
              <Printer className="size-4" /> Print Receipt
            </Button>
            <Button className="flex-1" onClick={onNewSale}>
              New Sale
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function POSInterface() {
  const [itemSearch, setItemSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptData, setReceiptData] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [variantPickerItem, setVariantPickerItem] = useState(null);
  const [errors, setErrors] = useState({ customerName: "", customerPhone: "" });

  const { data: allItems = [], isLoading: itemsLoading } = useItemDropdown();
  const { mutate: createSale, isPending: submitting } = useCreateSaleMutation();

  const filteredItems = useMemo(() => {
    if (!itemSearch.trim()) return allItems;
    const q = itemSearch.toLowerCase();
    return allItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.category_name ?? "").toLowerCase().includes(q)
    );
  }, [allItems, itemSearch]);

  const addToCart = (item) => {
    if (item.variants?.length > 0) {
      setVariantPickerItem(item);
      return;
    }
    addItemToCart(item, null);
  };

  const addItemToCart = (item, variant) => {
    const cartKey = variant ? `${item.id}-${variant.id}` : `${item.id}`;
    const price = variant?.selling_price ? Number(variant.selling_price) : Number(item.selling_price);
    const displayName = variant ? `${item.name} · ${variant.name}` : item.name;
    setCart((prev) => {
      const existing = prev.find((e) => e.cart_key === cartKey);
      if (existing) {
        return prev.map((e) => e.cart_key === cartKey ? { ...e, quantity: e.quantity + 1 } : e);
      }
      return [
        ...prev,
        {
          cart_key: cartKey,
          item_id: item.id,
          variant_id: variant?.id ?? null,
          item_name: displayName,
          quantity: 1,
          unit_price: price,
        },
      ];
    });
    setVariantPickerItem(null);
  };

  const changeQty = (cartKey, newQty) => {
    if (newQty < 1) {
      removeFromCart(cartKey);
      return;
    }
    setCart((prev) =>
      prev.map((e) => (e.cart_key === cartKey ? { ...e, quantity: newQty } : e))
    );
  };

  const removeFromCart = (cartKey) => {
    setCart((prev) => prev.filter((e) => e.cart_key !== cartKey));
  };

  const subtotal = cart.reduce((sum, e) => sum + e.quantity * Number(e.unit_price), 0);
  const discountNum = Number(discount) || 0;
  const total = Math.max(0, subtotal - discountNum);

  const handleCompleteSale = () => {
    const newErrors = { customerName: "", customerPhone: "" };

    if (cart.length === 0) {
      toast.error("Add at least one item to the cart.");
      return;
    }

    if (!customerName.trim()) {
      newErrors.customerName = "Customer name is required";
    }

    if (!customerPhone.trim()) {
      newErrors.customerPhone = "Phone number is required.";
    }

    if (newErrors.customerName || newErrors.customerPhone) {
      setErrors(newErrors);
      return;
    }

    setErrors({ customerName: "", customerPhone: "" });

    const paidNum = paidAmount ? Number(paidAmount) : total;
    if (paidNum < 0) {
      toast.error("Paid amount cannot be negative.");
      return;
    }

    const payload = {
      ...(customerName && { customer_name: customerName }),
      customer_phone: customerPhone.trim(),
      ...(customerAddress && { customer_address: customerAddress }),
      items: cart.map((e) => ({
        item_id: e.item_id,
        variant_id: e.variant_id,
        quantity: e.quantity,
        unit_price: e.unit_price,
      })),
      discount: discountNum,
      payment_method: paymentMethod,
      paid_amount: paidNum,
      ...(notes && { notes }),
    };
    const cartSnapshot = [...cart];
    createSale(payload, {
      onSuccess: (res) => {
        const sale = res?.data?.data ?? res?.data ?? {};
        toast.success("Sale completed successfully!");
        setReceiptData({ sale, cartSnapshot });
        setReceiptOpen(true);
      },
      onError: (err) => {
        toast.error(err?.response?.data?.message ?? "Failed to complete sale.");
      },
    });
  };

  const handleNewSale = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setPaymentMethod("cash");
    setDiscount("");
    setPaidAmount("");
    setNotes("");
    setReceiptOpen(false);
    setReceiptData(null);
    setVariantPickerItem(null);
  };

  return (
    <>
      <div className="flex h-[calc(100vh-3.5rem)] gap-0 -mx-6 -mt-6 -mb-6">
        {/* LEFT: Item Browser */}
        <div className="flex flex-col flex-1 min-w-0 border-r border-border/40 bg-background">
          {/* Header with search and title */}
          <div className="px-6 py-4 border-b border-border/40 space-y-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Point of Sale</h1>
              <p className="text-xs text-muted-foreground mt-1">Add items to cart and complete sales</p>
            </div>
            <div className="flex items-center gap-2.5 h-10 px-4 rounded-lg border border-border bg-muted/40 hover:bg-muted/60 transition-colors">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                placeholder="Search items by name or category…"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {itemsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <Package className="size-10 opacity-30" />
                <p className="text-sm">
                  {itemSearch ? "No items match your search." : "No items available."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredItems.map((item) => (
                  <ItemCard key={item.id} item={item} onAdd={addToCart} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Cart */}
        <div className="flex flex-col w-130 shrink-0 bg-card border-l border-border/40">
          {/* Cart header */}
          <div className="px-6 py-4 border-b border-border/40 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ShoppingCart className="size-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold">Order Summary</h2>
              {cart.length > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
              )}
            </div>
            {cart.length > 0 && (
              <span className="inline-flex items-center justify-center size-7 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {cart.reduce((s, e) => s + e.quantity, 0)}
              </span>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 min-h-72 overflow-y-auto px-6 py-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <ShoppingCart className="size-12 opacity-20" />
                <div className="text-center">
                  <p className="text-sm font-medium">Cart is empty</p>
                  <p className="text-xs mt-1">Add items from the left panel to get started</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((entry) => (
                  <CartItem
                    key={entry.cart_key}
                    entry={entry}
                    onChangeQty={changeQty}
                    onRemove={removeFromCart}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Customer + payment details */}
          <div className="border-t border-border/40 px-6 py-4 space-y-5 overflow-y-auto">
            {/* Customer section header */}
            <div className="pt-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Name <span className="text-destructive">*</span>
                </label>
                <input
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (errors.customerName) setErrors({ ...errors, customerName: "" });
                  }}
                  placeholder="Customer name"
                  className={cn(
                    "w-full h-10 rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-colors",
                    errors.customerName
                      ? "border-destructive focus:ring-destructive/50"
                      : "border-input focus:ring-ring/50"
                  )}
                />
                {errors.customerName && (
                  <p className="text-xs text-destructive font-medium">{errors.customerName}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Phone <span className="text-destructive">*</span>
                </label>
                <input
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    if (errors.customerPhone) setErrors({ ...errors, customerPhone: "" });
                  }}
                  placeholder="03XX-XXXXXXX"
                  className={cn(
                    "w-full h-10 rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-colors",
                    errors.customerPhone
                      ? "border-destructive focus:ring-destructive/50"
                      : "border-input focus:ring-ring/50"
                  )}
                />
                {errors.customerPhone && (
                  <p className="text-xs text-destructive font-medium">{errors.customerPhone}</p>
                )}
              </div>
            </div>

            {/* Payment section header */}
            <div className="pt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Method</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Discount (PKR)</label>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Address</label>
              <input
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Optional address…"
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">Amount to Pay (PKR)</label>
                <button
                  type="button"
                  onClick={() => setPaidAmount(total.toString())}
                  className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
                >
                  Use Total
                </button>
              </div>
              <input
                type="number"
                min="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder={total.toString()}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Notes</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes…"
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
              />
            </div>
          </div>

          {/* Totals + submit */}
          <div className="border-t border-border/60 px-6 py-4 space-y-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>PKR {subtotal.toLocaleString()}</span>
            </div>
            {discountNum > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>- PKR {discountNum.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t border-border pt-3">
              <span>Total</span>
              <span>PKR {total.toLocaleString()}</span>
            </div>

            {paidAmount && Number(paidAmount) > 0 && Number(paidAmount) < total && (
              <div className="flex justify-between text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-3 py-2 rounded-lg border border-orange-200 dark:border-orange-800 font-medium">
                <span>Khata Balance</span>
                <span>PKR {(total - Number(paidAmount)).toLocaleString()}</span>
              </div>
            )}

            <Button
              className="w-full mt-2"
              size="lg"
              onClick={handleCompleteSale}
              disabled={submitting || cart.length === 0}
            >
              {submitting ? "Processing…" : "Complete Sale"}
            </Button>

            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="w-full text-xs text-muted-foreground hover:text-destructive transition-colors py-2"
              >
                Clear cart
              </button>
            )}
          </div>
        </div>
      </div>

      <ReceiptDialog
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        receiptData={receiptData}
        onNewSale={handleNewSale}
      />
      <VariantPickerDialog
        item={variantPickerItem}
        onClose={() => setVariantPickerItem(null)}
        onSelect={addItemToCart}
      />
    </>
  );
}
