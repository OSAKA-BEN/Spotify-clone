"use client"

import { useRouter } from "next/navigation"
import { useUser } from "@/hooks/useUser"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { useState } from "react"
import { useEffect } from "react"
import { useAuthModal } from "@/hooks/useAuthModal"
import { AiOutlineHeart } from "react-icons/ai"
import { AiFillHeart } from "react-icons/ai"
import toast from "react-hot-toast"

interface LikeButtonProps {
  songId: string
}

const LikeButton = ({ songId }: LikeButtonProps) => {
  const router = useRouter()
  const supabaseClient = useSupabaseClient()
  const authModal = useAuthModal()
  const { user } = useUser()
  const [isLiked, setIsLiked] = useState(false)

  useEffect(() => {
    if (!user?.id) {
      return
    }

    const fetchData = async () => {
      const { data, error } = await supabaseClient
        .from("liked_songs")
        .select("*")
        .eq("user_id", user.id)
        .eq("song_id", songId)
        .single()

      if (!error && data) {
        setIsLiked(true)
      }
    }

    fetchData()
  }, [songId, user?.id, supabaseClient])

  const Icon = isLiked ? AiFillHeart : AiOutlineHeart

  const handleLike = async () => {
    if (!user) {
      return authModal.onOpen()
    }

    if (isLiked) {
      const { error } = await supabaseClient
        .from("liked_songs")
        .delete()
        .eq("user_id", user.id)
        .eq("song_id", songId)

      if (error) {
        toast.error(error.message)
      } else {
        setIsLiked(false)
      }

    } else {
      const { error } = await supabaseClient
        .from("liked_songs")
        .insert({ song_id: songId, user_id: user.id })

      if (error) {
        toast.error(error.message)
      } else {
        setIsLiked(true)
        toast.success("Liked!")
      }
    }

    router.refresh()
  }


  return (
    <button className="hover:opacity-75 transition" onClick={handleLike}>
      <Icon
        color={isLiked ? "#22c55e" : "white"}
        size={25}
      />
    </button>
  )
}

export default LikeButton
