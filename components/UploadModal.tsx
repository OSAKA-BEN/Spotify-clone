"use client"

import { useForm, SubmitHandler } from "react-hook-form"
import { FieldValues } from "react-hook-form"
import Modal from "./Modal"
import { useUploadModal } from "@/hooks/useUploadModal"
import { useState } from "react"
import Input from "./Input"
import Button from "./Button"
import { toast } from "react-hot-toast"
import { useUser } from "@/hooks/useUser"
import uniqueId  from "uniqid"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { useRouter } from "next/navigation"

const UploadModal = () => {
  const uploadModal = useUploadModal()
  const { user } = useUser()
  const supabaseClient = useSupabaseClient()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, reset, formState: { } } = useForm<FieldValues>({
    defaultValues: {
      author: "",
      title: "",
      song: null,
      image: null
    }
  })

  const onChange = (open: boolean) => {
    if (!open) {
      reset()
      uploadModal.onClose()
    }
  }

  const onSubmit: SubmitHandler<FieldValues> = async (values) => {
    try {
      setIsLoading(true)

      const imageFile = values.image?.[0]
      const songFile = values.song?.[0]

      if (!user) {
        toast.error("Must be logged in")
        return
      }

      if (!imageFile) {
        toast.error("Image file is required")
        return
      }

      if (!songFile) {
        toast.error("Song file is required")
        return
      }

      if (!values.title || !values.author) {
        toast.error("Title and author are required")
        return
      }

      const uniqueID = uniqueId()
      const { data: songData, error: songError } = await supabaseClient.storage.from("songs").upload(`song-${values.title}-${uniqueID}`, songFile, { cacheControl: '3600', upsert: false })

      if (songError) {
        setIsLoading(false)
        toast.error("Failed to upload song file")
        return
      }

      const { data: imageData, error: imageError } = await supabaseClient.storage.from("images").upload(`image-${values.title}-${uniqueID}`, imageFile, { cacheControl: '3600', upsert: false })

      if (imageError) {
        setIsLoading(false)
        toast.error("Failed to upload image file")
        return
      }

      const { error: supabaseError } = await supabaseClient
        .from("songs")
        .insert({
          user_id: user.id,
          title: values.title,
          author: values.author,
          image_path: imageData.path,
          song_path: songData.path
        })

      if (supabaseError) {
        setIsLoading(false)
        toast.error(supabaseError.message)
        return
      }

      router.refresh()
      setIsLoading(false)
      reset()
      uploadModal.onClose()
      toast.success("Song uploaded successfully")

    } catch (error) {
      toast.error(`Something went wrong: ${error}`);
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal title="Add a song" description="Upload an mp3 file" isOpen={uploadModal.isOpen} onChange={onChange}>
      <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Input
          id="title"
          disabled={isLoading}
          {...register("title", { required: true })}
          placeholder="Song title"
        />
        <Input
          id="author"
          disabled={isLoading}
          {...register("author", { required: true })}
          placeholder="Song author"
        />
        <div>
          <div className="pb-1">Select a song file</div>
          <Input
            id="song"
            type="file"
            disabled={isLoading}
            accept=".mp3"
            {...register("song", { required: true })}
          />
        </div>
        <div>
          <div className="pb-1">Select an image</div>
          <Input
            id="image"
            type="file"
            disabled={isLoading}
            accept=".jpg, .jpeg, .png"
            {...register("image", { required: true })}
          />
        </div>
        <Button 
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Uploading..." : "Upload"}
        </Button>
      </form>
    </Modal>
  )
}

export default UploadModal
