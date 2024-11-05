import { getURL } from "@/libs/helpers"
import { stripe } from "@/libs/stripe"
import { createOrRetrieveCustomer } from "@/libs/supabaseAdmin"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {

  try {

    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { user },
    } = await supabase.auth.getUser()
  
    if (!user) {
      return new NextResponse("Unauthorized", { status: 403 })
    }
  
    const customer = await createOrRetrieveCustomer({
      uuid: user.id,
      email: user.email || "",
    })
  
    if (!customer) {
      return new NextResponse("Unauthorized", { status: 403 })
    }
  
    const { url } = await stripe.billingPortal.sessions.create({
      customer,
      return_url: `${getURL()}/account`,
    })

    return NextResponse.json({ url })

  } catch (error: unknown) {
    console.log(error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}