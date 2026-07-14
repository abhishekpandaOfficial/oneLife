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
      <div className="mb-6 flex items-center gap-3">
        <img src="/onelife-logo.svg" alt="OneLife" className="h-12 w-12 rounded-2xl shadow-lg" />
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Welcome to</p>
          <h1 className="text-2xl font-extrabold tracking-normal">OneLife OS</h1>
        </div>
      </div>

      <Tabs defaultValue="social" className="w-full">
        <TabsList className="grid h-11 w-full grid-cols-2 rounded-2xl bg-muted/70">
          <TabsTrigger value="social" className="rounded-xl">
            <LockKeyhole className="mr-2 h-4 w-4" />
            Sign in
          </TabsTrigger>
          <TabsTrigger value="mobile" className="rounded-xl">
            <Smartphone className="mr-2 h-4 w-4" />
            Mobile OTP
          </TabsTrigger>
        </TabsList>

        <TabsContent value="social" className="mt-5 space-y-3">
          <Button
            type="button"
            variant="outline"
            className="group h-14 w-full justify-between rounded-2xl border-[#d0d5dd] bg-white text-base font-bold shadow-sm transition-all hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50/40 hover:shadow-lg"
            onClick={() => handleProvider("google")}
          >
            <span className="flex items-center">
              <span className="mr-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-[#eaecf0]">
                <FaGoogle className="h-5 w-5 text-[#4285F4]" />
              </span>
              Continue with Google
            </span>
            <ArrowRight className="h-4 w-4 text-[#98a2b3] transition group-hover:translate-x-1 group-hover:text-cyan-600" />
          </Button>
          <Button
            type="button"
            variant="outline"
            className="group h-14 w-full justify-between rounded-2xl border-[#111827] bg-[#111827] text-base font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-black hover:shadow-xl"
            onClick={() => handleProvider("apple")}
          >
            <span className="flex items-center">
              <span className="mr-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <FaApple className="h-5 w-5" />
              </span>
              Continue with Apple
            </span>
            <ArrowRight className="h-4 w-4 text-white/50 transition group-hover:translate-x-1 group-hover:text-white" />
          </Button>
        </TabsContent>

        <TabsContent value="mobile" className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Mobile number</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="h-12 rounded-2xl text-base"
              placeholder="+91 98765 43210"
            />
          </div>

          {otpSent && (
            <div className="space-y-2">
              <Label>One-time password</Label>
              <InputOTP maxLength={6} value={otp} onChange={setOtp} containerClassName="justify-between">
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot key={index} index={index} className="h-11 w-10 rounded-xl border bg-background text-base" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          )}

          <Button
            type="button"
            className="h-12 w-full rounded-2xl bg-[#111827] text-white hover:bg-[#0b1220]"
            onClick={otpSent ? handleVerifyOtp : handleSendOtp}
            disabled={isBusy || (otpSent && otp.length < 6)}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            {otpSent ? "Verify OTP" : "Send OTP"}
          </Button>
        </TabsContent>
      </Tabs>

      {(status || error) && (
        <p className={cn("mt-4 rounded-2xl px-4 py-3 text-sm", error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700")}>
          {error || status}
        </p>
      )}

    </div>
  );
}
