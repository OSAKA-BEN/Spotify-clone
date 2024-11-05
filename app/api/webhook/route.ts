import Stripe from "stripe"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { upsertProductRecord, upsertPriceRecord, manageSubscriptionStatusChange } from "@/libs/supabaseAdmin"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const relevantEvents = new Set(["product.created", "product.updated", "price.created", "price.updated", "checkout.session.completed", "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"])

export async function POST(req: Request) {
  const body = await req.text()
  const sig = headers().get("Stripe-Signature")

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event: Stripe.Event

  try {
    if (!sig || !webhookSecret) return
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (error: unknown) {
    console.log(`Webhook error: ${error}`)
    return new NextResponse("Webhook error", { status: 400 })
  }

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case "product.created":
        case "product.updated":
          const product = event.data.object as Stripe.Product
          await upsertProductRecord(product)
          break
        case "price.created":
        case "price.updated":
          const price = event.data.object as Stripe.Price
          await upsertPriceRecord(price)
          break
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
          const subscription = event.data.object as Stripe.Subscription
          await manageSubscriptionStatusChange(subscription.id, subscription.customer as string, event.type === "customer.subscription.deleted")
          break
        case "checkout.session.completed":
          const checkoutSession = event.data.object as Stripe.Checkout.Session
          if (checkoutSession.mode === "subscription") {
            const subscriptionId = checkoutSession.subscription
            await manageSubscriptionStatusChange(subscriptionId as string, checkoutSession.customer as string, true)
          }
          break
        default:
          throw new Error(`Unhandled event type ${event.type}`)
      }
    } catch (error: unknown) {
      console.log(`Webhook handler failed: ${error}`)
      return new NextResponse("Webhook handler failed", { status: 400 })
    }
  }

  return NextResponse.json({ received: true })
}

