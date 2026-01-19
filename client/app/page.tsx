"use client"

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/spinner";
import { useEffect } from "react";
import { Terminal, Sparkles, Mail, LogOut, Shield, Zap, MessageSquare, Wrench, Bot, ChevronRight, ExternalLink } from "lucide-react";

export default function Home() {

  const { data, isPending } = authClient.useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isPending && !data?.session && !data?.user) {
      router.push("/sign-in")
    }
  }, [isPending, data, router])

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="w-8 h-8 text-cyan-400" />
          <p className="text-sm text-zinc-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const features = [
    {
      icon: MessageSquare,
      title: "Chat Mode",
      description: "Simple conversational AI",
      color: "cyan"
    },
    {
      icon: Wrench,
      title: "Tool Calling",
      description: "Google Search, Code Execution",
      color: "violet"
    },
    {
      icon: Bot,
      title: "Agent Mode",
      description: "Autonomous app generator",
      color: "emerald"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-12 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-zinc-800/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center gap-6 mb-12">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
            <div className="relative p-4 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 shadow-2xl">
              <Terminal className="w-12 h-12 text-cyan-400" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-medium text-cyan-400 uppercase tracking-widest">Star CLI</span>
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Welcome Back
            </h1>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Profile Card - Spans 2 columns on large screens */}
          <div className="lg:col-span-2">
            <div className="relative group h-full">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 shadow-2xl p-8 h-full">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full blur-md opacity-50" />
                    <img
                      src={data?.user?.image || "./vercel.svg"}
                      alt={data?.user?.name || "User"}
                      width={100}
                      height={100}
                      className="relative rounded-full border-4 border-zinc-800 object-cover w-24 h-24"
                    />
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full border-4 border-zinc-900 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 text-center sm:text-left space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {data?.user?.name || "User"}
                      </h2>
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-zinc-400">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{data?.user?.email}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-medium text-emerald-400">Authenticated</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-xs font-medium text-cyan-400">CLI Linked</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-6 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-xl bg-zinc-800/50">
                    <p className="text-2xl font-bold text-white">3</p>
                    <p className="text-xs text-zinc-500">AI Modes</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-zinc-800/50">
                    <p className="text-2xl font-bold text-white">∞</p>
                    <p className="text-xs text-zinc-500">Chats</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-zinc-800/50">
                    <p className="text-2xl font-bold text-emerald-400">●</p>
                    <p className="text-xs text-zinc-500">Online</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800 shadow-2xl p-6 h-full flex flex-col">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Account</h3>
              
              <div className="flex-1 space-y-3">
                <a 
                  href="https://github.com" 
                  target="_blank"
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 transition-all group/link"
                >
                  <span className="text-sm text-zinc-300">GitHub Profile</span>
                  <ExternalLink className="w-4 h-4 text-zinc-500 group-hover/link:text-cyan-400 transition-colors" />
                </a>
              </div>

              <button
                onClick={() => authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => router.push("/sign-in"),
                    onError: (ctx) => console.log("Error signing out", ctx)
                  }
                })}
                className="mt-4 w-full py-3 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-xl border border-red-500/20 hover:border-red-500/30 transition-all duration-200 flex items-center justify-center gap-2 group/btn"
              >
                <LogOut className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Available Modes</h3>
            <span className="text-xs text-zinc-500">Use &apos;star wakeup&apos; in terminal</span>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group relative bg-zinc-900/60 backdrop-blur rounded-xl border border-zinc-800 p-5 hover:border-zinc-700 transition-all duration-300"
              >
                <div className={`w-10 h-10 rounded-lg bg-${feature.color}-500/10 flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-5 h-5 text-${feature.color}-400`} />
                </div>
                <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
                <p className="text-sm text-zinc-500">{feature.description}</p>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-700 group-hover:text-zinc-500 group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        </div>

        {/* Terminal Hint */}
        <div className="mt-8 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-zinc-300">Ready to start?</p>
              <p className="text-xs text-zinc-500">Run <code className="px-2 py-0.5 rounded bg-zinc-800 text-cyan-400 font-mono">star wakeup</code> in your terminal</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-600 mt-10">
          Powered by <span className="text-zinc-400">Star AI</span> • Your CLI is connected
        </p>
      </div>
    </div>
  );
}
