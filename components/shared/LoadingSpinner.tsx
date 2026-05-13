"use client"

import { Loader2 } from "lucide-react"

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
    </div>
  )
}

export function LoadingDots() {
  return (
    <div className="flex items-center justify-center space-x-2 p-4">
      <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
      <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse delay-100" />
      <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse delay-200" />
    </div>
  )
}
