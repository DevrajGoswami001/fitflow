"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "lucide-react"

export function Avatar() {
  const supabase = createClient()
  const [user, setUser] = useState<{
    user_metadata?: {
      avatar_url?: string
      full_name?: string
    }
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function getUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()
  }, [supabase])

  if (isLoading) {
    return (
      <div className="h-10 w-10 rounded-full bg-surface-2 animate-pulse" />
    )
  }

  const avatarUrl = user?.user_metadata?.avatar_url
  const initials = (user?.user_metadata?.full_name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 text-white text-sm font-semibold">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={user?.user_metadata?.full_name || "User"}
          className="h-10 w-10 rounded-full object-cover"
        />
      ) : (
        initials || <User className="h-5 w-5" />
      )}
    </div>
  )
}
