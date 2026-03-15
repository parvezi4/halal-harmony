import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getPremiumPriceId, stripe } from "@/config/stripe";

const VALID_INTERVALS = ["monthly", "quarterly", "semiannual", "annual"] as const;

export async function POST(req: Request) {
  try {
    const authSession = await getServerSession(authOptions);

    if (!authSession?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const interval = body?.interval ?? "monthly";

    if (!VALID_INTERVALS.includes(interval)) {
      return NextResponse.json(
        { success: false, error: "Invalid billing interval" },
        { status: 400 }
      );
    }

    const priceId = getPremiumPriceId(interval);
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${baseUrl}/dashboard?upgraded=1`,
      cancel_url: `${baseUrl}/pricing`,
      billing_address_collection: "auto",
      allow_promotion_codes: true,
      client_reference_id: authSession.user.id,
      customer_email: authSession.user.email ?? undefined,
      metadata: {
        userId: authSession.user.id,
        userEmail: authSession.user.email ?? "",
        interval,
      },
    });

    if (!checkoutSession.url) {
      return NextResponse.json(
        { success: false, error: "Unable to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating Stripe checkout session", error);
    return NextResponse.json(
      { success: false, error: "Unable to create checkout session" },
      { status: 500 }
    );
  }
}

