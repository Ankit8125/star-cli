"use client"

import { LoginForm } from '@/components/login-form'
import { Spinner } from '@/components/ui/spinner'
import { authClient } from '@/lib/auth-client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

const Page = () => {
  const { data, isPending } = authClient.useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackURL = searchParams.get("callbackURL") || "/"

  useEffect(() => {
    if (data?.session && data?.user) {
      router.push(callbackURL)
    }
  }, [data, router, callbackURL])

  if (isPending) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Spinner />
      </div>
    )
  }

  return (
    <>
      <LoginForm />
    </>
  )
}

export default Page