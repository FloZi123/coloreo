import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { slug, name, rating, body, email } = await req.json();

    if (!slug || !name || !rating || !email) {
      return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
    }
    if (!email.includes("@")) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }
    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return NextResponse.json({ ok: false, error: "invalid_rating" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Load book by slug
    const { data: book } = await admin.from("books").select("id").eq("slug", slug).maybeSingle();
    if (!book) {
      return NextResponse.json({ ok: false, error: "book_not_found" }, { status: 404 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check for verified purchase: email has a paid order containing this book
    const { data: orderItem } = await admin
      .from("order_items")
      .select("id, order_id, orders!inner(customer_email, status)")
      .eq("book_id", book.id)
      .eq("orders.status", "paid")
      .eq("orders.customer_email", normalizedEmail)
      .maybeSingle();

    let source: "verified_purchase" | "review_copy";

    if (orderItem) {
      source = "verified_purchase";
    } else {
      // Check for valid, unused review invite
      const { data: invite } = await admin
        .from("review_invites")
        .select("id, used_at")
        .eq("email", normalizedEmail)
        .eq("book_id", book.id)
        .is("used_at", null)
        .maybeSingle();

      if (!invite) {
        return NextResponse.json(
          { ok: false, error: "not_eligible" },
          { status: 403 }
        );
      }

      // Mark invite as used
      await admin
        .from("review_invites")
        .update({ used_at: new Date().toISOString() })
        .eq("id", invite.id);

      source = "review_copy";
    }

    // Check if user already submitted a review for this book (prevent duplicates)
    const { data: existing } = await admin
      .from("reviews")
      .select("id")
      .eq("book_id", book.id)
      .eq("author_name", name)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: false, error: "already_reviewed" }, { status: 409 });
    }

    await admin.from("reviews").insert({
      book_id: book.id,
      rating: r,
      author_name: name.trim().slice(0, 100),
      body: body ? String(body).trim().slice(0, 2000) : null,
      is_approved: false,
      source,
    });

    return NextResponse.json({ ok: true, source });
  } catch (e) {
    console.error("[reviews POST]", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
