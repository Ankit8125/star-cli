"use client"

import { authClient } from '@/lib/auth-client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Shield, Terminal, Sparkles, ArrowRight, Loader2, AlertCircle, Lock } from 'lucide-react'

const DeviceAuthorizationPage = () => {

  const [userCode, setUserCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Auto-fill code from URL if present
  useEffect(() => {
    const codeFromUrl = searchParams.get("user_code")
    if (codeFromUrl) {
      const formatted = codeFromUrl.toUpperCase().replace(/[^A-Z0-9]/g, "")
      if (formatted.length > 4) {
        setUserCode(formatted.slice(0, 4) + "-" + formatted.slice(4, 8))
      } else {
        setUserCode(formatted)
      }
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null)
    setIsLoading(true)

    try {
      // Format the code: remove dashes and convert to uppercase
      const formattedCode = userCode.trim().replace(/-/g, "").toUpperCase();
      // Check if the code is valid using GET /device endpoint
      const response = await authClient.device({
        query: { user_code: formattedCode },
      });

      if (response.data) {
        // Redirect to approval page
        router.push(`/approve?user_code=${formattedCode}`);
      }
    } catch (err) {
      setError("Invalid or expired code. Please check and try again.");
    } finally {
      setIsLoading(false)
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
    if (value.length > 4) {
      value = value.slice(0, 4) + "-" + value.slice(4, 8)
    }
    setUserCode(value)
  }

  const isCodeComplete = userCode.replace(/-/g, "").length === 8

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-zinc-800/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Branding */}
        <div className="flex flex-col items-center gap-6 mb-10">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
            <div className="relative p-4 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 shadow-2xl">
              <Terminal className="w-10 h-10 text-cyan-400" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-medium text-cyan-400 uppercase tracking-widest">Star CLI</span>
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Device Authorization
            </h1>
            <p className="text-zinc-400 text-sm max-w-xs mx-auto">
              Link your terminal to your account securely
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <form
            onSubmit={handleSubmit}
            className="relative bg-zinc-900/80 backdrop-blur-xl rounded-2xl p-8 border border-zinc-800 shadow-2xl"
          >
            <div className="space-y-6">
              {/* Code Input Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="code"
                    className="text-sm font-medium text-zinc-300 flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4 text-cyan-400" />
                    Device Code
                  </label>
                  <span className="text-xs text-zinc-500">
                    {userCode.replace(/-/g, "").length}/8 characters
                  </span>
                </div>

                <div className="relative">
                  <input
                    id="code"
                    type="text"
                    value={userCode}
                    onChange={handleCodeChange}
                    placeholder="XXXX-XXXX"
                    maxLength={9}
                    autoFocus
                    className="w-full px-5 py-4 bg-zinc-950/50 border-2 border-zinc-700/50 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 font-mono text-center text-2xl tracking-[0.3em] transition-all duration-200"
                  />
                  {isCodeComplete && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-xs text-zinc-500 flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  Enter the code displayed in your terminal
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-400">Verification Failed</p>
                    <p className="text-xs text-red-400/70 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !isCodeComplete}
                className="w-full py-4 px-6 bg-linear-to-r from-cyan-500 to-violet-500 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-violet-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 group/btn shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur">
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-300">Security Notice</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                This code expires in 30 minutes. Never share it with anyone. Star CLI will never ask for your password.
              </p>
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

export default DeviceAuthorizationPage