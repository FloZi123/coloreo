"use client";

import { useTransition } from "react";
import { refundOrder } from "@/app/admin/actions";

export default function RefundButton({ orderId }: { orderId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => {
        if (confirm("Bestellung wirklich erstatten? (Stripe-Refund + Status auf erstattet)")) {
          start(() => refundOrder(orderId));
        }
      }}
      disabled={pending}
      className="rounded-full border px-3 py-1 text-xs font-semibold text-accent hover:bg-accent-soft disabled:opacity-50"
    >
      {pending ? "…" : "Erstatten"}
    </button>
  );
}
