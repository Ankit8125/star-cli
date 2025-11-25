"use client"

import { LoginForm } from '@/components/login-form'
import { Spinner } from '@/components/ui/spinner'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const Page = () => {
  const { data, isPending } = authClient.useSession()
  const router = useRouter()

  useEffect(() => {
    if (data?.session && data?.user) {
      router.push("/")
    }
  }, [data, router])

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