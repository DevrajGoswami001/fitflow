"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Check } from "lucide-react"

interface CompletionAnimationProps {
  isVisible: boolean
  onComplete: () => void
}

export function CompletionAnimation({
  isVisible,
  onComplete,
}: CompletionAnimationProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="completion"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
          onAnimationComplete={onComplete}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6 }}
            className="w-24 h-24 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center"
          >
            <Check className="w-12 h-12 text-white" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Confetti({ count = 12 }: { count?: number }) {
  const confetti = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2
    const velocity = 4 + Math.random() * 4
    return {
      id: i,
      tx: Math.cos(angle) * velocity * 100,
      ty: Math.sin(angle) * velocity * 100,
      color: ["#7C3AED", "#EC4899", "#06B6D4", "#FBBF24", "#34D399"][
        Math.floor(Math.random() * 5)
      ],
    }
  })

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {confetti.map((item) => (
        <motion.div
          key={item.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: item.tx,
            y: item.ty,
            opacity: 0,
            scale: 0,
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="fixed left-1/2 top-1/2 w-3 h-3 rounded-full"
          style={{ backgroundColor: item.color }}
        />
      ))}
    </div>
  )
}
