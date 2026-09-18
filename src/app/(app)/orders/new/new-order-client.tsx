"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Minus, Trash2, ShoppingCart, ArrowLeft, CheckCircle2, Save, MessageSquare, Utensils, Package, Truck, Gift } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { createOrderAction } from "@/actions/orders";
import { SearchInput } from "@/components/ui/shared";

type Product = { id: string; name: string; sellingPrice: number; costPrice: number; currentStock: number; categoryId: string | null; imageUrl: string | null };
type Category = { id: string; name: string };
type Customer = { id: string; name: string };

type CartItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  instructions: string;
};

const ORDER_TYPES = [
  { value: "DINE_IN", label: "Dine-in", icon: Utensils },
  { value: "TAKEAWAY", label: "Takeaway", icon: Package },
  { value: "DELIVERY", label: "Delivery", icon: Truck },
];

const ORDER_SOURCES = [
  { value: "WALK_IN", label: "Walk-in" },
  { value: "PHONE", label: "Phone" },
  { value: "FOODPANDA", label: "Foodpanda" },
  { value: "UBER_EATS", label: "Uber Eats" },
  { value: "WEBSITE", label: "Website" },
  { value: "OTHER", label: "Other" },
];

export function NewOrderClient({
  products,
  categories,
  customers,
}: {
  products: Product[];
  categories: Category[];
  customers: Customer[];
}) {
  const router = useRouter();
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [discount, setDiscount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [orderType, setOrderType] = useState("DINE_IN");
  const [isComplimentary, setIsComplimentary] = useState(false);
  const [orderSource, setOrderSource] = useState("WALK_IN");
  const [editingInstructions, setEditingInstructions] = useState<string | null>(null);

  const filtered = products.filter((p) => {
    const matchesCat = selectedCat === "all" || p.categoryId === selectedCat;
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === p.id);
      if (existing) {
        if (existing.quantity >= p.currentStock && p.currentStock > 0) {
          toast.warning(`Only ${p.currentStock} in stock`);
          return prev;
        }
        return prev.map((i) =>
          i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { productId: p.id, name: p.name, quantity: 1, unitPrice: p.sellingPrice, costPrice: p.costPrice, instructions: "" }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const updateInstructions = (productId: string, instructions: string) => {
    setCart((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, instructions } : i))
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const subtotal = cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const cardFee = paymentMethod === "CARD" && !isComplimentary ? Math.round(subtotal * 0.025 * 100) / 100 : 0;
  const total = isComplimentary ? 0 : Math.max(0, subtotal - discount + cardFee);

  const submit = async (complete: boolean) => {
    if (!cart.length) {
      toast.error("Add at least one item to the order");
      return;
    }
    setSubmitting(true);
    const form = new FormData();
    if (customerId) form.append("customerId", customerId);
    form.append("discount", String(discount));
    form.append("paymentMethod", paymentMethod);
    form.append("amountPaid", isComplimentary ? "0" : complete ? String(total) : "0");
    form.append("paymentStatus", isComplimentary ? "PAID" : complete ? "PAID" : "UNPAID");
    form.append("status", isComplimentary ? "COMPLETED" : complete ? "COMPLETED" : "PENDING");
    form.append("orderType", orderType);
    form.append("isComplimentary", String(isComplimentary));
    form.append("source", orderSource);
    for (const item of cart) {
      form.append("itemName", item.name);
      form.append("itemQty", String(item.quantity));
      form.append("itemPrice", String(item.unitPrice));
      form.append("itemCost", String(item.costPrice));
      form.append("itemProductId", item.productId);
      form.append("itemInstructions", item.instructions);
    }

    const res = await createOrderAction(null, form);
    setSubmitting(false);
    if (res.ok) {
      const label = isComplimentary ? "PR/Complimentary order recorded" : complete ? "Order completed — inventory & revenue updated" : "Order saved as pending";
      toast.success(label);
      router.push(`/orders/${res.data.id}`);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  const customerOptions = customers.map((c) => ({ value: c.id, label: c.name }));

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col lg:flex-row lg:gap-6">
      {/* Product picker */}
      <div className="flex-1">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/orders" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="text-lg font-bold text-slate-900">New Order</h1>
          <div className="w-24" />
        </div>

        {/* Order type selector */}
        <div className="mb-4 flex gap-2">
          {ORDER_TYPES.map((ot) => {
            const Icon = ot.icon;
            return (
              <button
                key={ot.value}
                onClick={() => setOrderType(ot.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                  orderType === ot.value
                    ? "border-amber-600 bg-amber-50 text-amber-800"
                    : "border-slate-200 bg-white text-slate-600 hover:border-amber-300"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {ot.label}
              </button>
            );
          })}
          <div className="ml-auto">
            <button
              onClick={() => setIsComplimentary(!isComplimentary)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                isComplimentary
                  ? "border-purple-600 bg-purple-50 text-purple-800"
                  : "border-slate-200 bg-white text-slate-600 hover:border-purple-300"
              )}
            >
              <Gift className="h-3.5 w-3.5" />
              {isComplimentary ? "PR Order" : "PR / Comp"}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <SearchInput value={query} onChange={setQuery} placeholder="Search products..." />
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <CategoryChip active={selectedCat === "all"} onClick={() => setSelectedCat("all")}>
            All
          </CategoryChip>
          {categories.map((c) => (
            <CategoryChip key={c.id} active={selectedCat === c.id} onClick={() => setSelectedCat(c.id)}>
              {c.name}
            </CategoryChip>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={p.currentStock <= 0}
              className={cn(
                "group rounded-xl border border-slate-200 bg-white p-3 text-left transition-all hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md",
                p.currentStock <= 0 && "cursor-not-allowed opacity-50"
              )}
            >
              <div className="flex items-center justify-between">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-600/10 to-amber-600/10 text-lg">
                    🧋
                  </div>
                )}
                <Plus className="h-4 w-4 text-amber-700 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="mt-2 line-clamp-2 min-h-[2rem] text-[13px] font-medium leading-snug text-slate-800">{p.name}</p>
              <p className="mt-1 text-sm font-bold tabular-nums text-slate-900">{formatCurrency(p.sellingPrice)}</p>
              <p className={cn("text-[11px]", p.currentStock <= 0 ? "text-rose-500" : p.currentStock <= 5 ? "text-amber-600" : "text-slate-400")}>
                {p.currentStock <= 0 ? "Out of stock" : `${p.currentStock} in stock`}
              </p>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-slate-400">No products found</div>
          )}
        </div>
      </div>

      {/* Cart / checkout */}
      <div className="mt-6 w-full lg:mt-0 lg:w-96 lg:shrink-0">
        <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ShoppingCart className="h-4 w-4 text-amber-700" />
              Order <span className="text-xs font-normal text-slate-400">({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
            </h2>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-slate-400 hover:text-rose-500">
                Clear
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-3xl">🧋</p>
              <p className="mt-2 text-sm text-slate-400">Tap products to add them to the order</p>
            </div>
          ) : (
            <div className="max-h-[40vh] space-y-2 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.productId} className="rounded-lg border border-slate-100 p-2">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-400">{formatCurrency(item.unitPrice)} each</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.productId, -1)} className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50">
                        <Minus className="h-3 w-3 text-slate-500" />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                      <button onClick={() => updateQty(item.productId, 1)} className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50">
                        <Plus className="h-3 w-3 text-slate-500" />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.productId)} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-500">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  {/* Per-item instructions */}
                  <div className="mt-1.5">
                    {editingInstructions === item.productId ? (
                      <div className="flex gap-1">
                        <input
                          type="text"
                          autoFocus
                          value={item.instructions}
                          onChange={(e) => updateInstructions(item.productId, e.target.value)}
                          onBlur={() => setEditingInstructions(null)}
                          onKeyDown={(e) => e.key === "Enter" && setEditingInstructions(null)}
                          placeholder="e.g. Extra ice, no boba, less sugar"
                          className="h-7 flex-1 rounded border border-amber-300 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingInstructions(item.productId)}
                        className={cn(
                          "flex w-full items-center gap-1 rounded px-2 py-1 text-left text-xs transition-colors",
                          item.instructions
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                        )}
                      >
                        <MessageSquare className="h-3 w-3 shrink-0" />
                        {item.instructions || "Add instructions..."}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-600">Customer</p>
                  <Combobox
                    options={customerOptions}
                    value={customerId}
                    onSelect={setCustomerId}
                    placeholder="Walk-in customer"
                    searchPlaceholder="Search customers..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="mb-1 text-xs font-medium text-slate-600">Discount</p>
                    <input
                      type="number"
                      min={0}
                      value={discount || ""}
                      onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                      placeholder="0"
                      className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-slate-600">Payment</p>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none"
                    >
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card (+2.5% fee)</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-600">Order Source</p>
                  <select
                    value={orderSource}
                    onChange={(e) => setOrderSource(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none"
                  >
                    {ORDER_SOURCES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span><span className="tabular-nums">{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>Discount</span><span className="tabular-nums">-{formatCurrency(discount)}</span>
                  </div>
                )}
                {cardFee > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Card fee (2.5%)</span><span className="tabular-nums">{formatCurrency(cardFee)}</span>
                  </div>
                )}
                {isComplimentary && (
                  <div className="flex justify-between text-purple-600">
                    <span>PR / Complimentary</span><span className="tabular-nums font-semibold">FREE</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-900">
                  <span>Total</span><span className="tabular-nums">{isComplimentary ? "FREE" : formatCurrency(total)}</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="outline" disabled={submitting} onClick={() => submit(false)}>
                  <Save className="h-4 w-4" />
                  Save pending
                </Button>
                <Button disabled={submitting} onClick={() => submit(true)} className="bg-amber-700 hover:bg-amber-800">
                  <CheckCircle2 className="h-4 w-4" />
                  Complete sale
                </Button>
              </div>
              <p className="mt-2 text-center text-[11px] text-slate-400">
                {isComplimentary ? "PR orders track inventory but skip revenue." : "Completing deducts inventory and records revenue automatically."}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
        active
          ? "border-amber-600 bg-amber-700 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-amber-300"
      )}
    >
      {children}
    </button>
  );
}