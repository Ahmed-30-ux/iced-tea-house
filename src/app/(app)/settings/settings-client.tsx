"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  Users,
  FolderTree,
  ScrollText,
  Shield,
  Loader2,
  Plus,
  Trash2,
  KeyRound,
  MapPin,
} from "lucide-react";
import { cn, formatDateTime, initials } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { updateBusinessInfoAction, updateProfileAction, changePasswordAction, updateCardFeeAction, getCardFeeAction } from "@/actions/settings";
import { registerUserAction } from "@/actions/auth";
import { createCategoryAction, deleteCategoryAction } from "@/actions/categories";
import { createLocationAction, deleteLocationAction } from "@/actions/locations";

type BusinessData = { name: string; tagline: string; instagram: string; currency: string; isDemo: boolean };
type UserData = { id: string; name: string; email: string; role: string; active: boolean; createdAt: string };
type CategoryData = { id: string; name: string; description: string | null; productCount: number };
type LocationData = { id: string; name: string; address: string | null; phone: string | null; isActive: boolean };
type AuditData = { id: string; userName: string; action: string; entityType: string | null; details: string | null; createdAt: string };

const roleLabel: Record<string, string> = { OWNER: "Owner", MANAGER: "Manager", STAFF: "Staff" };
const roleColor: Record<string, string> = { OWNER: "bg-violet-100 text-violet-700", MANAGER: "bg-sky-100 text-sky-700", STAFF: "bg-slate-100 text-slate-600" };

const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Card", "Other"];
const EXPENSE_CATEGORIES = ["Rent", "Utilities", "Salaries", "Marketing", "Transport", "Packaging", "Maintenance", "Supplies", "Other"];

export function SettingsClient({
  business,
  users,
  categories,
  locations,
  audit,
}: {
  business: BusinessData;
  users: UserData[];
  categories: CategoryData[];
  locations: LocationData[];
  audit: AuditData[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState("business");
  const [busy, setBusy] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [addCatOpen, setAddCatOpen] = useState(false);
  const [addLocOpen, setAddLocOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <div className="lg:col-span-1">
        <div className="space-y-1 rounded-xl border border-slate-200 bg-white p-2">
          <SettingTab active={tab === "business"} onClick={() => setTab("business")} icon={<Building2 className="h-4 w-4" />} label="Business Information" />
          <SettingTab active={tab === "team"} onClick={() => setTab("team")} icon={<Users className="h-4 w-4" />} label="Team & Roles" />
          <SettingTab active={tab === "categories"} onClick={() => setTab("categories")} icon={<FolderTree className="h-4 w-4" />} label="Product Categories" />
          <SettingTab active={tab === "locations"} onClick={() => setTab("locations")} icon={<MapPin className="h-4 w-4" />} label="Locations" />
          <SettingTab active={tab === "preferences"} onClick={() => setTab("preferences")} icon={<Shield className="h-4 w-4" />} label="Payment & Expenses" />
          <SettingTab active={tab === "account"} onClick={() => setTab("account")} icon={<KeyRound className="h-4 w-4" />} label="My Account" />
          <SettingTab active={tab === "audit"} onClick={() => setTab("audit")} icon={<ScrollText className="h-4 w-4" />} label="Audit Log" />
        </div>
      </div>

      <div className="lg:col-span-3">
        {tab === "business" && <BusinessSettings business={business} setBusy={setBusy} busy={busy} />}
        {tab === "team" && (
          <TeamSettings users={users} setBusy={setBusy} busy={busy} onAdd={() => setAddUserOpen(true)} />
        )}
        {tab === "categories" && (
          <CategoriesSettings categories={categories} onAdd={() => setAddCatOpen(true)} />
        )}
        {tab === "locations" && (
          <LocationsSettings locations={locations} onAdd={() => setAddLocOpen(true)} />
        )}
        {tab === "preferences" && <PreferencesSettings />}
        {tab === "account" && <AccountSettings />}
        {tab === "audit" && <AuditSettings audit={audit} />}
      </div>

      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>Default password: password123</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4 px-5 py-4"
            action={async (formData) => {
              const res = await registerUserAction(null, formData);
              if (res.ok) {
                toast.success("Team member added");
                setAddUserOpen(false);
                router.refresh();
              } else toast.error(res.error);
            }}
          >
            <div>
              <Label htmlFor="user-name">Full name</Label>
              <Input id="user-name" name="name" required placeholder="Team member name" />
            </div>
            <div>
              <Label htmlFor="user-email">Email</Label>
              <Input id="user-email" name="email" type="email" required placeholder="name@business.com" />
            </div>
            <div>
              <Label htmlFor="user-role">Role</Label>
              <Select id="user-role" name="role" defaultValue="STAFF">
                <option value="STAFF">Staff — orders and products</option>
                <option value="MANAGER">Manager — operations and finance</option>
                <option value="OWNER">Owner — full access</option>
              </Select>
            </div>
            <DialogFooter className="px-0">
              <Button type="button" variant="outline" onClick={() => setAddUserOpen(false)}>Cancel</Button>
              <Button type="submit">Add member</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={addCatOpen} onOpenChange={setAddCatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>Group products by a new category.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4 px-5 py-4"
            action={async (formData) => {
              const res = await createCategoryAction(null, formData);
              if (res.ok) {
                toast.success("Category added");
                setAddCatOpen(false);
                router.refresh();
              } else toast.error(res.error);
            }}
          >
            <div>
              <Label htmlFor="cat-name">Name</Label>
              <Input id="cat-name" name="name" required placeholder="e.g. Smoothies" />
            </div>
            <div>
              <Label htmlFor="cat-desc">Description (optional)</Label>
              <Input id="cat-desc" name="description" placeholder="What goes here?" />
            </div>
            <DialogFooter className="px-0">
              <Button type="button" variant="outline" onClick={() => setAddCatOpen(false)}>Cancel</Button>
              <Button type="submit">Add category</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={addLocOpen} onOpenChange={setAddLocOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Location</DialogTitle>
            <DialogDescription>Add a new store or warehouse location.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4 px-5 py-4"
            action={async (formData) => {
              const res = await createLocationAction(null, formData);
              if (res.ok) {
                toast.success("Location added");
                setAddLocOpen(false);
                router.refresh();
              } else toast.error(res.error);
            }}
          >
            <div>
              <Label htmlFor="loc-name">Location name</Label>
              <Input id="loc-name" name="name" required placeholder="e.g. Main Store" />
            </div>
            <div>
              <Label htmlFor="loc-address">Address (optional)</Label>
              <Input id="loc-address" name="address" placeholder="123 Main St" />
            </div>
            <div>
              <Label htmlFor="loc-phone">Phone (optional)</Label>
              <Input id="loc-phone" name="phone" placeholder="+92 300 1234567" />
            </div>
            <DialogFooter className="px-0">
              <Button type="button" variant="outline" onClick={() => setAddLocOpen(false)}>Cancel</Button>
              <Button type="submit">Add location</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SettingTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active ? "bg-amber-50 text-amber-800" : "text-slate-600 hover:bg-slate-50"
      )}
    >
      <span className={active ? "text-amber-700" : "text-slate-400"}>{icon}</span>
      {label}
    </button>
  );
}

function BusinessSettings({ business, setBusy, busy }: { business: BusinessData; setBusy: (b: boolean) => void; busy: boolean }) {
  const router = useRouter();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Information</CardTitle>
        <CardDescription>Branding shown across your dashboard. Configurable for any business.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={async (formData) => {
            setBusy(true);
            const res = await updateBusinessInfoAction(null, formData);
            setBusy(false);
            if (res.ok) {
              toast.success("Business information updated");
              router.refresh();
            } else toast.error(res.error);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="b-name">Business name</Label>
              <Input id="b-name" name="name" required defaultValue={business.name} />
            </div>
            <div>
              <Label htmlFor="b-currency">Currency</Label>
              <Select id="b-currency" name="currency" defaultValue={business.currency}>
                <option value="PKR">PKR — Pakistani Rupee</option>
                <option value="USD">USD — US Dollar</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="AED">AED — UAE Dirham</option>
                <option value="SAR">SAR — Saudi Riyal</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="b-tagline">Tagline</Label>
              <Input id="b-tagline" name="tagline" defaultValue={business.tagline ?? ""} />
            </div>
            <div>
              <Label htmlFor="b-instagram">Instagram</Label>
              <Input id="b-instagram" name="instagram" defaultValue={business.instagram ?? ""} placeholder="@yourhandle" />
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Current branding</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-lg">🧊</div>
              <div>
                <p className="text-sm font-bold text-slate-800">{business.name}</p>
                <p className="text-xs text-slate-500">{business.instagram ? `Instagram: ${business.instagram}` : business.tagline || "Your business. One connected dashboard."}</p>
              </div>
            </div>
          </div>
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function TeamSettings({ users, onAdd }: { users: UserData[]; onAdd: () => void; setBusy: (b: boolean) => void; busy: boolean }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Team & Roles</CardTitle>
          <CardDescription>Role-based access: Owner, Manager, Staff.</CardDescription>
        </div>
        <Button size="sm" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" /> Add member
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-700 text-[10px] font-bold text-white">
                      {initials(u.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", roleColor[u.role] ?? roleColor.STAFF)}>
                    <Shield className="h-3 w-3" />
                    {roleLabel[u.role] ?? u.role}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={u.active ? "success" : "neutral"}>{u.active ? "Active" : "Inactive"}</Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-500">{formatDateTime(u.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function CategoriesSettings({ categories, onAdd }: { categories: CategoryData[]; onAdd: () => void }) {
  const router = useRouter();
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Product Categories</CardTitle>
          <CardDescription>Customize how your products are grouped.</CardDescription>
        </div>
        <Button size="sm" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" /> Add category
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {categories.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No categories yet</p>}
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
              <div>
                <p className="text-sm font-medium text-slate-800">{c.name}</p>
                <p className="text-xs text-slate-400">{c.description ?? ""} · {c.productCount} products</p>
              </div>
              <button
                onClick={async () => {
                  const res = await deleteCategoryAction(c.id);
                  if (res.ok) {
                    toast.success("Category deleted");
                    router.refresh();
                  } else toast.error(res.error);
                }}
                className="rounded-md p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LocationsSettings({ locations, onAdd }: { locations: LocationData[]; onAdd: () => void }) {
  const router = useRouter();
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Locations</CardTitle>
          <CardDescription>Manage your store locations for multi-site operations.</CardDescription>
        </div>
        <Button size="sm" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" /> Add location
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {locations.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No locations yet</p>}
          {locations.map((loc) => (
            <div key={loc.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                  <MapPin className="h-4 w-4 text-amber-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{loc.name}</p>
                  <p className="text-xs text-slate-400">
                    {loc.address ?? "No address"} {loc.phone ? `· ${loc.phone}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={loc.isActive ? "success" : "neutral"}>{loc.isActive ? "Active" : "Inactive"}</Badge>
                {loc.isActive && (
                  <button
                    onClick={async () => {
                      const res = await deleteLocationAction(loc.id);
                      if (res.ok) {
                        toast.success("Location deactivated");
                        router.refresh();
                      } else toast.error(res.error);
                    }}
                    className="rounded-md p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PreferencesSettings() {
  const [cardFee, setCardFee] = useState(2.5);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  useState(() => {
    getCardFeeAction().then((res) => {
      if (res.ok && res.cardFeePercent !== undefined) {
        setCardFee(res.cardFeePercent);
      }
      setLoaded(true);
    });
  });

  const saveCardFee = async () => {
    setSaving(true);
    const res = await updateCardFeeAction(cardFee);
    setSaving(false);
    if (res.ok) {
      toast.success(`Card fee set to ${cardFee}%`);
    } else {
      toast.error(res.error ?? "Failed to save");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Card / POS Processing Fee</CardTitle>
          <CardDescription>Automatically added to orders paid by card. Currently set to {cardFee}%.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Label className="whitespace-nowrap">Fee percentage</Label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={cardFee}
              onChange={(e) => setCardFee(Number(e.target.value))}
              className="h-9 w-24 rounded-lg border border-slate-200 px-3 text-sm focus:border-amber-500 focus:outline-none"
            />
            <span className="text-sm text-slate-500">%</span>
            <Button size="sm" onClick={saveCardFee} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Save
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            This fee is calculated on the subtotal and added to the total when payment method is Card.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Accepted payment methods across the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((m) => (
              <Badge key={m} variant="secondary" className="rounded-full px-3 py-1">{m}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Expense Categories</CardTitle>
          <CardDescription>Categories used to classify expenses and reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {EXPENSE_CATEGORIES.map((c) => (
              <Badge key={c} variant="secondary" className="rounded-full px-3 py-1">{c}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Inventory Notifications</CardTitle>
          <CardDescription>Alerts fire automatically when stock crosses configured reorder levels.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
            <span>Low stock alerts</span><Badge variant="success">Enabled</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
            <span>Out of stock alerts</span><Badge variant="success">Enabled</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
            <span>Unpaid order reminders</span><Badge variant="success">Enabled</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
            <span>Large expense alerts (&ge; 50,000)</span><Badge variant="success">Enabled</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AccountSettings() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            action={async (formData) => {
              const res = await updateProfileAction(null, formData);
              if (res.ok) {
                toast.success("Profile updated");
                router.refresh();
              } else toast.error(res.error);
            }}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="p-name">Name</Label>
                <Input id="p-name" name="name" required />
              </div>
              <div>
                <Label htmlFor="p-email">Email</Label>
                <Input id="p-email" name="email" type="email" required />
              </div>
            </div>
            <Button type="submit">Save profile</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            action={async (formData) => {
              const res = await changePasswordAction(null, formData);
              if (res.ok) toast.success("Password changed");
              else toast.error(res.error);
            }}
          >
            <div>
              <Label htmlFor="cur-pass">Current password</Label>
              <Input id="cur-pass" name="currentPassword" type="password" required />
            </div>
            <div>
              <Label htmlFor="new-pass">New password</Label>
              <Input id="new-pass" name="newPassword" type="password" required />
            </div>
            <Button type="submit">Update password</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function AuditSettings({ audit }: { audit: AuditData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Log</CardTitle>
        <CardDescription>Every important action, tracked automatically.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {audit.length === 0 && (
              <TableRow><TableCell colSpan={4} className="py-10 text-center text-slate-400">No activity recorded yet</TableCell></TableRow>
            )}
            {audit.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="text-sm font-medium text-slate-700">{a.userName}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{a.action}</Badge>
                </TableCell>
                <TableCell className="max-w-[22rem] truncate text-xs text-slate-500">{a.details ?? "—"}</TableCell>
                <TableCell className="text-right text-xs text-slate-500">{formatDateTime(a.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}