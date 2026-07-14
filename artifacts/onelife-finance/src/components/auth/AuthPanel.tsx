import React, { useState } from "react";
import { FaApple, FaGoogle } from "react-icons/fa";
import { ArrowRight, LockKeyhole, MessageCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  sendMobileOtp,
  signInWithProvider,
  verifyMobileOtp,
} from "@/lib/supabaseAuth";
import { cn } from "@/lib/utils";

type AuthPanelProps = {
  mode?: "modal" | "page";
};

export function AuthPanel({ mode = "modal" }: AuthPanelProps) {
  const [phone, setPhone] = useState("+91 ");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const handleProvider = (provider: "google" | "apple") => {
    setError("");
    try {
      signInWithProvider(provider);
    } catch (err) {
      setError("Secure sign-in is not available yet. Please try again shortly.");
    }
  };

  const handleSendOtp = async () => {
    setError("");
    setStatus("");
    setIsBusy(true);
    try {
      await sendMobileOtp(phone.replace(/\s+/g, ""));
      setOtpSent(true);
      setStatus("OTP sent. Enter the 6 digit code to continue.");
    } catch (err) {
      setError("Mobile OTP is not available yet. Please try again shortly.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setStatus("");
    setIsBusy(true);
    try {
      await verifyMobileOtp(phone.replace(/\s+/g, ""), otp);
      setStatus("Signed in securely. Redirecting to your OneLife OS...");
      window.setTimeout(() => {
        window.location.href = "/app";
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The OTP could not be verified.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className={cn("w-full", mode === "page" && "mx-auto max-w-md")}>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-slate-900/5">
          <img src="/onelife-logo.svg" alt="OneLife" className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome to OneLife</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">Your personal command center</p>
      </div>

      <Tabs defaultValue="social" className="w-full">
        <TabsList className="mb-6 grid h-12 w-full grid-cols-2 rounded-xl bg-slate-100 p-1">
          <TabsTrigger value="social" className="rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
            <LockKeyhole className="mr-2 h-4 w-4" />
            Sign in
          </TabsTrigger>
          <TabsTrigger value="mobile" className="rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
            <Smartphone className="mr-2 h-4 w-4" />
            Mobile OTP
          </TabsTrigger>
        </TabsList>

        <TabsContent value="social" className="mt-0 space-y-3">
          <Button
            type="button"
            variant="outline"
            className="group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl border-slate-200 bg-white text-base font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
            onClick={() => handleProvider("google")}
          >
            <FaGoogle className="absolute left-4 h-5 w-5 text-[#4285F4]" />
            Continue with Google
          </Button>
          <Button
            type="button"
            variant="outline"
            className="group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl border-slate-900 bg-slate-900 text-base font-semibold text-white shadow-sm transition-all hover:bg-slate-800"
            onClick={() => handleProvider("apple")}
          >
            <FaApple className="absolute left-4 h-5 w-5" />
            Continue with Apple
          </Button>
        </TabsContent>

        <TabsContent value="mobile" className="mt-0 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">Mobile number</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="h-12 rounded-xl border-slate-200 bg-white px-4 text-base font-medium shadow-sm transition-colors focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="+91 98765 43210"
            />
          </div>

          {otpSent && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label className="text-sm font-semibold text-slate-700">One-time password</Label>
              <InputOTP maxLength={6} value={otp} onChange={setOtp} containerClassName="justify-between">
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot key={index} index={index} className="h-12 w-11 rounded-xl border-slate-200 bg-white text-lg font-bold shadow-sm transition-colors focus:border-indigo-500 focus:ring-indigo-500" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          )}

          <Button
            type="button"
            className="h-12 w-full rounded-xl bg-indigo-600 text-base font-semibold text-white shadow-sm hover:bg-indigo-700"
            onClick={otpSent ? handleVerifyOtp : handleSendOtp}
            disabled={isBusy || (otpSent && otp.length < 6)}
          >
            {isBusy ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {otpSent ? "Verify securely" : "Send secure code"}
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </TabsContent>
      </Tabs>

      {(status || error) && (
        <div className={cn(
          "mt-6 rounded-xl p-4 text-sm font-medium animate-in fade-in slide-in-from-top-2",
          error ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
        )}>
          {error || status}
        </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-xs font-medium text-slate-500">
          By signing in, you agree to our Terms of Service and Privacy Policy. Securely encrypted.
        </p>
      </div>
    </div>
  );
}
