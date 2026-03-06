import { NextResponse } from "next/server";
import { getPremiumPriceId, stripe } from "@/config/stripe";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const interval = (body?.interval ?? "monthly") as
      | "monthly"
      | "quarterly"
      | "semiannual"
      | "annual";

    const priceId = getPremiumPriceId(interval);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/dashboard?upgraded=1`,
      cancel_url: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/pricing`,
      billing_address_collection: "auto"
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating Stripe checkout session", error);
    return NextResponse.json(
      { error: "Unable to create checkout session" },
      { status: 500 }
    );
  }
}

