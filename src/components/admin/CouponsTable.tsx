"use client";

import { useTransition } from "react";
import { toggleCoupon, deleteCoupon } from "@/app/admin/actions";
import { formatPrice } from "@/lib/pricing";

interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_order_cents: number;
  redeemed_count: number;
  is_active: boolean;
}

export default function CouponsTable({ coupons }: { coupons: Coupon[] }) {
  const [pending, start] = useTransition();
  return (
    <div className={`card overflow-hidden ${pending ? "opacity-60" : ""}`}>
      <table className="w-full text-sm">
        <thead className="bg-primary-soft text-left text-xs uppercase text-ink-soft">
          <tr>
            <th className="p-3">Code</th>
            <th className="p-3">Rabatt</th>
            <th className="p-3">Mindestbestellwert</th>
            <th className="p-3">Eingelöst</th>
            <th className="p-3">Aktiv</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {coupons.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted">Noch keine Gutscheine.</td></tr>}
          {coupons.map((c) => (
            <tr key={c.id} className="border-t">
              <td className="p-3 font-mono font-semibold">{c.code}</td>
              <td className="p-3">{c.type === "percent" ? `${c.value}%` : formatPrice(Math.round(c.value * 100))}</td>
              <td className="p-3 text-muted">{c.min_order_cents > 0 ? formatPrice(c.min_order_cents) : "–"}</td>
              <td className="p-3">{c.redeemed_count}×</td>
              <td className="p-3">
                <button onClick={() => start(() => toggleCoupon(c.id, c.is_active))} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.is_active ? "bg-success/15 text-success" : "bg-muted/15 text-muted"}`}>
                  {c.is_active ? "aktiv" : "inaktiv"}
                </button>
              </td>
              <td className="p-3">
                <button onClick={() => start(() => deleteCoupon(c.id))} className="text-muted hover:text-accent">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
