import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  const business = await prisma.business.findFirst({ include: { _count: { select: { users: true } } } });
  const hasData = !!business && business._count.users > 0;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-amber-600/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-32 h-[34rem] w-[34rem] rounded-full bg-amber-400/10 blur-[120px]" />
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[26rem]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-3xl shadow-lg shadow-amber-500/20">
            🧊
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">ICED TEA HOUSE</h1>
          <p className="mt-1.5 text-sm text-slate-400">Your business. One connected dashboard.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl">
          <LoginForm hasData={hasData} businessName={business?.name ?? "Iced Tea House"} />
        </div>

        {hasData && (
          <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.03] p-4">
            <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Demo accounts
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { role: "Owner", email: "owner@icedteahouse.com" },
                { role: "Manager", email: "manager@icedteahouse.com" },
                { role: "Staff", email: "staff@icedteahouse.com" },
              ].map((a) => (
                <div key={a.role} className="rounded-lg bg-white/5 px-2 py-2">
                  <p className="text-xs font-medium text-slate-200">{a.role}</p>
                  <p className="mt-0.5 truncate text-[10px] text-slate-500">{a.email}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-500">Password: <span className="font-mono text-slate-300">password123</span></p>
          </div>
        )}
      </div>
    </div>
  );
}