"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const root = document.documentElement
    setIsDark(root.classList.contains("dark"))
  }, [])

  const toggleTheme = () => {
    const root = document.documentElement
    root.classList.toggle("dark")
    setIsDark(!isDark)
    localStorage.setItem("theme", root.classList.contains("dark") ? "dark" : "light")
  }

  if (!isMounted) return null

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-lg"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-yellow-400" />
      ) : (
        <Moon className="h-5 w-5 text-slate-600" />
      )}
    </Button>
  )
}
