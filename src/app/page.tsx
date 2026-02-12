'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard (will be caught by middleware and sent to login if not authenticated)
    router.push('/dashboard')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">กำลังโหลด...</h1>
        <p className="text-muted-foreground">Hotel Reception Management System</p>
      </div>
    </div>
  )
}
