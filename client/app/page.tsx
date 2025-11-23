"use client"

import Image from "next/image";
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/spinner";

export default function Home() {

  const {data, isPending} = authClient.useSession()
  const router = useRouter()

  if(isPending){
    return (
    <div className="flex flex-col justify-center items-center h-screen">
        <Spinner />
      </div>
    )
  }

  if(!data?.session && !data?.user){
    router.push("/sign-in")
  }

  return (
    <div className="">
      <Button>Click me</Button>
    </div>
  );
}
