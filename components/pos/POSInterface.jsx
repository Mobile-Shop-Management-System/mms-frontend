"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CheckCircle,
  Package,
  Printer,
  X,
  User,
  CreditCard,
  Layers,
  StickyNote,
  Wallet,
  ScanLine,
} from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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

/** Format a number as PKR currency. */
function fmtPKR(n) {
  return "PKR " + Number(n ?? 0).toLocaleString("en-PK");
}

/** Small labelled section heading used in the cart panel. */
function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="size-3.5 text-muted-foreground" />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

/** Consistent input styling across the cart form. */
const inputBase =
  "w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring transition-colors";

function ItemCard({ item, onAdd }) {
  const outOfStock = item.quantity_in_stock <= 0;
  const lowStock = !outOfStock && item.quantity_in_stock <= 5;
  const image =
    item.images?.find((img) => img.is_primary)?.image ??
    item.images?.[0]?.image ??
    null;

  return (
    <button
      onClick={() => !outOfStock && onAdd(item)}
      disabled={outOfStock}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all duration-200",
        outOfStock
          ? "border-border/50 bg-muted/30 cursor-not-allowed"
          : "border-border bg-card cursor-pointer hover:border-primary/60 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]",
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted/40">
        {image ? (
          <img
            src={image}
            alt={item.name}
            loading="lazy"
            className={cn(
              "size-full object-cover transition-transform duration-300",
              outOfStock ? "grayscale opacity-50" : "group-hover:scale-105",
            )}
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Package
              className={cn(
                "size-8 text-muted-foreground/30",
                outOfStock && "opacity-50",
              )}
            />
          </div>
        )}

        {/* Stock badge */}
        <div className="absolute left-2 top-2">
          {outOfStock ? (
            <span className="rounded-md bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
              Out of stock
            </span>
          ) : lowStock ? (
            <span className="rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
              Only {item.quantity_in_stock} left
            </span>
          ) : (
            <span className="rounded-md bg-background/85 px-1.5 py-0.5 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur-sm">
              {item.quantity_in_stock} in stock
            </span>
          )}
        </div>

        {/* Variant count */}
        {item.variants?.length > 0 && (
          <div className="absolute right-2 top-2">
            <span className="flex items-center gap-1 rounded-md bg-background/85 px-1.5 py-0.5 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur-sm">
              <Layers className="size-2.5" />
              {item.variants.length}
            </span>
          </div>
        )}

        {/* Add affordance */}
        {!outOfStock && (
          <div className="absolute bottom-2 right-2 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0">
            <Plus className="size-4" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="truncate text-sm font-semibold leading-tight text-foreground">
          {item.name}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {item.category_name || item.brand_name || "Uncategorized"}
        </p>
        <p className="mt-auto pt-1.5 text-sm font-bold tabular-nums text-foreground">
          {fmtPKR(item.selling_price)}
        </p>
      </div>
    </button>
  );
}

function VariantPickerDialog({ item, onClose, onSelect }) {
  if (!item) return null;
  const availableVariants = item.variants.filter(
    (v) => v.quantity_in_stock > 0,
  );
  return (
    <Dialog
      open={Boolean(item)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Select Variant</DialogTitle>
          <DialogDescription>
            {item.name} — choose a variant to add to cart
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {availableVariants.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              All variants are out of stock.
            </p>
          ) : (
            availableVariants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => onSelect(item, variant)}
                className="group w-full flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm transition-all hover:border-primary/60 hover:bg-primary/5"
              >
                <div className="min-w-0 text-left">
                  <p className="truncate font-medium">{variant.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {variant.quantity_in_stock} in stock
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2.5">
                  <span className="font-bold tabular-nums">
                    {fmtPKR(variant.selling_price ?? item.selling_price)}
                  </span>
                  <span className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Plus className="size-3" />
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
    <div className="group relative rounded-lg border border-border/60 bg-background p-3 transition-colors hover:border-border">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">
            {entry.item_name}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {fmtPKR(entry.unit_price)} each
          </p>
        </div>
        <button
          onClick={() => onRemove(entry.cart_key)}
          aria-label={`Remove ${entry.item_name}`}
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
          <button
            onClick={() => onChangeQty(entry.cart_key, entry.quantity - 1)}
            aria-label="Decrease quantity"
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            <Minus className="size-3" />
          </button>
          <span className="w-8 text-center text-sm font-semibold tabular-nums">
            {entry.quantity}
          </span>
          <button
            onClick={() => onChangeQty(entry.cart_key, entry.quantity + 1)}
            aria-label="Increase quantity"
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            <Plus className="size-3" />
          </button>
        </div>
        <p className="text-sm font-bold tabular-nums">{fmtPKR(lineTotal)}</p>
      </div>
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
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Customer
              </p>
              <p className="text-sm font-medium mt-0.5">{sale.customer_name}</p>
              {sale.customer_phone && (
                <p className="text-xs text-muted-foreground">
                  {sale.customer_phone}
                </p>
              )}
            </div>
          )}

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                    Item
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">
                    Qty
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {cartSnapshot.map((entry, i) => (
                  <tr
                    key={i}
                    className="border-b border-border/40 last:border-0"
                  >
                    <td className="px-3 py-2">{entry.item_name}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {entry.quantity}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      PKR{" "}
                      {(
                        entry.quantity * Number(entry.unit_price)
                      ).toLocaleString()}
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
                <span className="text-green-600">
                  - PKR {Number(sale.discount).toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>PKR {Number(sale?.total ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Payment</span>
              <span>
                {PAYMENT_METHODS.find((m) => m.value === sale?.payment_method)
                  ?.label ??
                  sale?.payment_method ??
                  "—"}
              </span>
            </div>
          </div>

          {/* Payment Details Section */}
          {sale && (
            <div
              className={`rounded-lg border-2 p-3 space-y-2 ${
                sale.khata && sale.khata.remaining_amount > 0
                  ? "border-orange-300 bg-orange-50 dark:bg-orange-900/20"
                  : "border-green-300 bg-green-50 dark:bg-green-900/20"
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                  Payment Details
                </p>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    sale.khata && sale.khata.remaining_amount > 0
                      ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                      : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  }`}
                >
                  {sale.khata && sale.khata.remaining_amount > 0
                    ? "Khata Pending"
                    : "Paid"}
                </span>
              </div>

              <div className="flex justify-between text-sm border-b border-border pb-1.5">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-semibold">
                  PKR {Number(sale.total).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-green-700 dark:text-green-400 font-medium">
                  Paid Amount
                </span>
                <span className="font-semibold text-green-700 dark:text-green-400">
                  PKR{" "}
                  {sale.khata
                    ? Number(sale.khata.paid_amount).toLocaleString()
                    : Number(sale.total).toLocaleString()}
                </span>
              </div>

              {sale.khata && sale.khata.remaining_amount > 0 && (
                <div className="flex justify-between text-sm bg-orange-100 dark:bg-orange-900/40 p-1.5 rounded">
                  <span className="font-bold text-orange-700 dark:text-orange-400">
                    Remaining Amount
                  </span>
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
        (item.category_name ?? "").toLowerCase().includes(q),
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
    const price = variant?.selling_price
      ? Number(variant.selling_price)
      : Number(item.selling_price);
    const displayName = variant ? `${item.name} · ${variant.name}` : item.name;
    setCart((prev) => {
      const existing = prev.find((e) => e.cart_key === cartKey);
      if (existing) {
        return prev.map((e) =>
          e.cart_key === cartKey ? { ...e, quantity: e.quantity + 1 } : e,
        );
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
      prev.map((e) =>
        e.cart_key === cartKey ? { ...e, quantity: newQty } : e,
      ),
    );
  };

  const removeFromCart = (cartKey) => {
    setCart((prev) => prev.filter((e) => e.cart_key !== cartKey));
  };

  const subtotal = cart.reduce(
    (sum, e) => sum + e.quantity * Number(e.unit_price),
    0,
  );
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
        <div className="flex flex-col flex-1 min-w-0 bg-muted/20">
          {/* Header with search and title */}
          <div className="shrink-0 border-b border-border/60 bg-background/80 px-6 py-4 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ScanLine className="size-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold leading-tight tracking-tight">
                    Point of Sale
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {itemsLoading
                      ? "Loading catalogue…"
                      : `${filteredItems.length} item${filteredItems.length !== 1 ? "s" : ""} available`}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search by name, brand or category…"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/40"
              />
              {itemSearch && (
                <button
                  onClick={() => setItemSearch("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {itemsLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="h-52 rounded-xl" />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                  <Package className="size-7 text-muted-foreground/40" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {itemSearch ? "No matching items" : "No items available"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {itemSearch
                      ? "Try a different name, brand or category."
                      : "Add items to your inventory to start selling."}
                  </p>
                </div>
                {itemSearch && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setItemSearch("")}
                  >
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                {filteredItems.map((item) => (
                  <ItemCard key={item.id} item={item} onAdd={addToCart} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Cart */}
        <div className="flex w-104 shrink-0 flex-col border-l border-border/60 bg-card">
          {/* Cart header */}
          <div className="flex shrink-0 items-center gap-3 border-b border-border/60 px-5 py-4">
            <div className="relative">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <ShoppingCart className="size-4.5 text-primary" />
              </div>
              {cart.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-card">
                  {cart.reduce((s, e) => s + e.quantity, 0)}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold leading-tight">
                Current Order
              </h2>
              <p className="text-xs text-muted-foreground">
                {cart.length === 0
                  ? "No items yet"
                  : `${cart.length} line item${cart.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-3" />
                Clear
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="min-h-40 flex-1 overflow-y-auto px-5 py-4">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                  <ShoppingCart className="size-7 text-muted-foreground/40" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Cart is empty
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Select items from the catalogue to begin.
                  </p>
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
          <div className="max-h-[45%] shrink-0 space-y-4 overflow-y-auto border-t border-border/60 bg-muted/20 px-5 py-4">
            {/* Customer */}
            <div className="space-y-2.5">
              <SectionLabel icon={User}>Customer</SectionLabel>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <input
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (errors.customerName)
                        setErrors({ ...errors, customerName: "" });
                    }}
                    placeholder="Name *"
                    className={cn(
                      inputBase,
                      errors.customerName
                        ? "border-destructive focus:border-destructive focus:ring-destructive/40"
                        : "border-input",
                    )}
                  />
                  {errors.customerName && (
                    <p className="text-[11px] font-medium text-destructive">
                      {errors.customerName}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <input
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      if (errors.customerPhone)
                        setErrors({ ...errors, customerPhone: "" });
                    }}
                    placeholder="Phone *"
                    className={cn(
                      inputBase,
                      errors.customerPhone
                        ? "border-destructive focus:border-destructive focus:ring-destructive/40"
                        : "border-input",
                    )}
                  />
                  {errors.customerPhone && (
                    <p className="text-[11px] font-medium text-destructive">
                      {errors.customerPhone}
                    </p>
                  )}
                </div>
              </div>
              <input
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Address (optional)"
                className={cn(inputBase, "border-input")}
              />
            </div>

            {/* Payment */}
            <div className="space-y-2.5">
              <SectionLabel icon={CreditCard}>Payment</SectionLabel>
              <div className="grid grid-cols-2 gap-2.5">
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger size="sm" className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="Discount"
                    className={cn(inputBase, "border-input pr-10 tabular-nums")}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground">
                    PKR
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">
                    Amount received
                  </label>
                  <button
                    type="button"
                    onClick={() => setPaidAmount(total.toString())}
                    className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/20"
                  >
                    Pay full
                  </button>
                </div>
                <div className="relative">
                  <Wallet className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="number"
                    min="0"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder={total.toString()}
                    className={cn(
                      inputBase,
                      "border-input pl-9 font-semibold tabular-nums",
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2.5">
              <SectionLabel icon={StickyNote}>Notes</SectionLabel>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional note for this sale…"
                className={cn(inputBase, "border-input")}
              />
            </div>
          </div>

          {/* Totals + submit */}
          <div className="shrink-0 space-y-3 border-t border-border/60 bg-card px-5 py-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium tabular-nums">
                  {fmtPKR(subtotal)}
                </span>
              </div>
              {discountNum > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                    − {fmtPKR(discountNum)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-baseline justify-between border-t border-border pt-3">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-xl font-bold tracking-tight tabular-nums">
                {fmtPKR(total)}
              </span>
            </div>

            {paidAmount &&
              Number(paidAmount) > 0 &&
              Number(paidAmount) < total && (
                <div className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/20">
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    Khata balance
                  </span>
                  <span className="text-sm font-bold tabular-nums text-amber-700 dark:text-amber-400">
                    {fmtPKR(total - Number(paidAmount))}
                  </span>
                </div>
              )}

            <Button
              className="h-11 w-full gap-2 text-sm font-semibold"
              onClick={handleCompleteSale}
              disabled={submitting || cart.length === 0}
            >
              {submitting ? (
                "Processing…"
              ) : (
                <>
                  <CheckCircle className="size-4" />
                  Complete Sale
                </>
              )}
            </Button>
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
