import { Song } from "@/types"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"


const getLikedSongs = async (): Promise<Song[]> => {
  const supabase = createServerComponentClient({ cookies })

  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError) {
    console.log(userError.message)
    return []
  }

  const { data, error } = await supabase
    .from("liked_songs")
    .select("*, songs(*)")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.log(error)
    return []
  }

  if (!data) {
    return []
  } 

  return data.map((item) => ({
    ...item.songs
  }))
  
}

export default getLikedSongs
