"use client"

import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { authClient } from "@/lib/auth-client"
import { useState } from "react"

export const LoginForm = () => {

  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)

  // Pass-through callbackURL so device-flow sign-ins return to /approve
  // instead of "/". Resolved against window.origin so better-auth treats it
  // as an absolute URL on the trusted origin.
  const relativeCallback = searchParams.get("callbackURL") || "/"
  const callbackURL = typeof window !== "undefined"
    ? new URL(relativeCallback, window.location.origin).toString()
    : `http://localhost:3000${relativeCallback}`

  return (
    <div className="flex flex-col gap-6 justify-center items-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <Image src={'./login.svg'} alt="Login" height={500} width={500} />
        <h1 className="text-6xl font-extrabold text-indigo-400">
          Welcome back to Star CLI
        </h1>
        <p className="text-base font-medium text-zinc-400">
          Login to your account to enable device flow.
        </p>
      </div>

      <Card className="border-dashed border-2">
        <CardContent>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              <Button
                variant={"outline"}
                className="w-full h-full"
                type="button"
                onClick={() => authClient.signIn.social({
                  provider: "github",
                  callbackURL
                })}
              >
                <Image src={'./github.svg'} alt="Github Logo" height={16} width={16} className="size-4 dark:invert" />
                Continue With Github
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}