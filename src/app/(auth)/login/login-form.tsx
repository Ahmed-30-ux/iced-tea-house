"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, LogIn, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/actions/auth";
import { seedDemoDataAction } from "@/actions/seed";

export function LoginForm({ hasData, businessName }: { hasData: boolean; businessName: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(loginAction, null as any);

  useEffect(() => {
    if (state && !state.ok) toast.error(state.error);
  }, [state]);

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">Welcome back</h2>
        <p className="mt-0.5 text-sm text-slate-400">Sign in to {businessName}</p>
      </div>

      <form
        action={async (formData: FormData) => {
          const res = await loginAction(null, formData);
          if (res.ok) {
            toast.success("Signed in successfully");
            router.push("/dashboard");
            router.refresh();
          } else {
            toast.error(res.error);
          }
        }}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="email" className="text-slate-300">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={hasData ? "owner@icedteahouse.com" : ""}
            placeholder="you@business.com"
            className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:border-amber-400 focus-visible:ring-amber-400/40"
          />
        </div>
        <div>
          <Label htmlFor="password" className="text-slate-300">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            defaultValue={hasData ? "password123" : ""}
            placeholder="••••••••"
            className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:border-amber-400 focus-visible:ring-amber-400/40"
          />
        </div>
        <Button type="submit" disabled={pending} className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      {!hasData && (
        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="mb-2 text-xs text-slate-400">
            No data found. Load the Iced Tea House demo workspace to explore the platform.
          </p>
          <form
            action={async () => {
              const res = await seedDemoDataAction();
              if (res.ok) {
                toast.success("Demo data loaded. Signing you in...");
                router.refresh();
              } else {
                toast.error(res.error);
              }
            }}
          >
            <Button type="submit" variant="outline" className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10">
              <RefreshCw className="h-4 w-4" />
              Load demo data
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}