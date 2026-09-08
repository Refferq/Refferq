"use client";
import { useI18n } from "@/i18n/provider";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Target, Mail, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";

type Step = "email" | "otp";

export default function LoginPage() {
  const { t: __tr } = useI18n();

  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const otpRes = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const otpData = await otpRes.json();

      if (otpRes.ok && otpData.success) {
        setStep("otp");
        setMessage(
          otpData.message ||
            __tr("A verification code has been sent to your email."),
        );
      } else {
        setError(otpData.message || __tr("Failed to send verification code"));
      }
    } catch (_e) {
      setError(__tr("Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      setError(__tr("Please enter the full 6-digit code"));
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code: otp }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const user = data.user;
        if (user.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/affiliate");
        }
      } else {
        setError(data.error || __tr("Invalid verification code"));
      }
    } catch (_e) {
      setError(__tr("Verification failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setMessage(__tr("A new verification code has been sent."));
      } else {
        setError(__tr("Failed to resend code. Please try again."));
      }
    } catch (_e) {
      setError(__tr("Failed to resend code."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
            <Target className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Refferq</h1>
          <p className="text-sm text-muted-foreground">
            {__tr("Affiliate Marketing Platform")}
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-xl shadow-black/5">
          {step === "email" ? (
            <>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">
                  {__tr("Welcome back")}
                </CardTitle>
                <CardDescription>
                  {__tr("Enter your email to sign in to your account")}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSendOTP}>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">{__tr("Email address")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                        autoFocus
                        autoComplete="email"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-4">
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={loading || !email}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="mr-2 h-4 w-4" />
                    )}
                    {loading
                      ? __tr("Sending code...")
                      : __tr("Continue with Email")}
                  </Button>
                </CardFooter>
              </form>
            </>
          ) : (
            <>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">
                  {__tr("Check your email")}
                </CardTitle>
                <CardDescription>
                  {__tr("We sent a 6-digit code to")}{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleVerifyOTP}>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {message && (
                    <Alert>
                      <AlertDescription>{message}</AlertDescription>
                    </Alert>
                  )}
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(value) => setOtp(value)}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={loading || otp.length < 6}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="mr-2 h-4 w-4" />
                    )}
                    {loading ? "Verifying..." : __tr("Verify & Sign in")}
                  </Button>
                  <div className="flex items-center justify-between w-full">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStep("email");
                        setOtp("");
                        setError("");
                        setMessage("");
                      }}
                    >
                      <ArrowLeft className="mr-1 h-3 w-3" />
                      {__tr("Change email")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResendOTP}
                      disabled={loading}
                    >
                      {__tr("Resend code")}
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </>
          )}
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          {__tr("Don&apos;t have an account?")}{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            {__tr("Sign up")}
          </Link>
        </p>
      </div>
    </div>
  );
}
