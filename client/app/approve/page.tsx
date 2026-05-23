"use client"

import { Spinner } from "@/components/ui/spinner"
import { authClient } from '@/lib/auth-client'
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { CheckCircle, XCircle, Terminal, Sparkles, Shield, User, Monitor, Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

const DeviceApprovalPage = () => {

  const {data, isPending} = authClient.useSession()

  const router = useRouter()
  const searchParams = useSearchParams()
  const userCode = searchParams.get("user_code")
  const [isProcessing, setIsProcessing] = useState({approve: false, deny: false})

  useEffect(() => {
    if(!isPending && !data?.session && !data?.user){
      router.push("/sign-in")
    }
  }, [isPending, data, router])
  
  if(isPending){
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="w-8 h-8 text-cyan-400" />
          <p className="text-sm text-zinc-400">Loading session...</p>
        </div>
      </div>
    )
  }

  const handleApprove = async () => {
    setIsProcessing({approve: true, deny: false});
    try {
      toast.loading("Approving device...", {id: "loading"})
      await authClient.device.approve({
        userCode: userCode!,
      });
      toast.dismiss("loading")
      toast.success("Device approved successfully! You can close this window.")
      router.push("/")

    } catch (error) {
      toast.dismiss("loading")
      toast.error("Failed to approve device");
    } finally {
      setIsProcessing({approve: false, deny: false});
    }
  };
  
  const handleDeny = async () => {
    setIsProcessing({approve: false, deny: true});
    try {
      toast.loading("Denying device...", {id: "deny"})
      // Use the deny method, not approve. better-auth's device-authorization
      // plugin exposes both — calling approve here was the original bug.
      await authClient.device.deny({
        userCode: userCode!,
      });
      toast.dismiss("deny")
      toast.success("Device denied")
      router.push("/")

    } catch (error) {
      toast.dismiss("deny")
      toast.error("Failed to deny device");
    } finally {
      setIsProcessing({approve: false, deny: false});
    }
  };

  // Format the code with a dash for display
  const formattedCode = userCode 
    ? `${userCode.slice(0, 4)}-${userCode.slice(4)}` 
    : "----−----"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-zinc-800/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Logo & Branding */}
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
            <div className="relative p-4 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 shadow-2xl">
              <Terminal className="w-10 h-10 text-emerald-400" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400 uppercase tracking-widest">Star CLI</span>
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Authorize Device
            </h1>
          </div>
        </div>

        {/* Main Card */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-emerald-500/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative bg-zinc-900/80 backdrop-blur-xl rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden">
            
            {/* Warning Banner */}
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3">
              <div className="flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <p className="text-xs font-medium text-amber-400">New device requesting access</p>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Device Visual */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center shadow-xl">
                    <Monitor className="w-10 h-10 text-cyan-400" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg animate-bounce">
                    <span className="text-white text-xs font-bold">?</span>
                  </div>
                </div>
              </div>

              {/* Code Display */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider text-center">
                  Authorization Code
                </p>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 rounded-xl blur-md" />
                  <div className="relative bg-zinc-950/80 rounded-xl p-4 border border-zinc-700/50">
                    <p className="text-3xl font-mono font-bold text-center tracking-[0.2em] bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                      {formattedCode}
                    </p>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">
                    {data?.user?.name || "User"}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {data?.user?.email}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-400">Active</span>
                </div>
              </div>

              {/* Security Notice */}
              <div className="flex gap-3 p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/30">
                <Shield className="w-5 h-5 text-zinc-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Only approve if you initiated this request from your terminal. If you didn&apos;t request this, click Deny.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {/* Deny Button */}
                <button
                  onClick={handleDeny}
                  disabled={isProcessing.deny || isProcessing.approve}
                  className="py-4 px-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl border border-zinc-700 hover:border-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                  {isProcessing.deny ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
                      <span>Deny</span>
                    </>
                  )}
                </button>

                {/* Approve Button */}
                <button
                  onClick={handleApprove}
                  disabled={isProcessing.approve || isProcessing.deny}
                  className="py-4 px-6 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 group"
                >
                  {isProcessing.approve ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span>Approve</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-600 mt-8">
          Powered by <span className="text-zinc-400">Star AI</span> • Secure Device Authorization
        </p>
      </div>
    </div>
  )
}

export default DeviceApprovalPage