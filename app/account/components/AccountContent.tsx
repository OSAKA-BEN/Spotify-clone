"use client"

import Button from "@/components/Button"
import { useSubscribeModal } from "@/hooks/useSubscribeModal"
import { useUser } from "@/hooks/useUser"
import { postData } from "@/libs/helpers"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import toast from "react-hot-toast"

export default function AccountContent() {
  const router = useRouter()
  const subscribeModal = useSubscribeModal()
  const { isLoading, subscription, user } = useUser()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/")
    }
  }, [isLoading, user, router])

  const redirectToCustomerPortal = async () => {
    setLoading(true)
    try {
      const { url } = await postData({ url: "/api/create-portal-link" })
      window.location.href = url
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-7 px-4">
      {!subscription && (
        <div className="flex flex-col gap-y-4">
          <p className="text-neutral-400">No active plan.</p>
          <Button className="w-[350px]" onClick={subscribeModal.onOpen}>
            Subscribe
          </Button>
        </div>
      )}
      {subscription && (
        <div className="flex flex-col gap-y-4">
          <p>
            You are currently on the <b>{subscription?.prices?.products?.name}</b>{" "}
            plan.
          </p>
          <Button
            className="w-[350px]"
            disabled={loading}
            onClick={redirectToCustomerPortal}
          >
            Open customer portal
          </Button>
        </div>
      )}
    </div>
  )
}
