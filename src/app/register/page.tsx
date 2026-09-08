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
import {
  Target,
  User,
  Mail,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from "lucide-react";

type Step = "details" | "otp" | "success";

export default function RegisterPage() {
  const { t: __tr } = useI18n();

  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Step 1: Register the user
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role: "AFFILIATE" }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        setError(registerData.message || __tr("Registration failed"));
        setLoading(false);
        return;
      }

      // Step 2: Send OTP
      const otpRes = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const otpData = await otpRes.json();

      if (otpRes.ok) {
        setStep("otp");
        setMessage(
          __tr(
            "Account created! A verification code has been sent to your email.",
          ),
        );
      } else {
        // Registration succeeded but OTP failed - still move to OTP step
        setStep("otp");
        setError(otpData.error || __tr("Failed to send code. Try resending."));
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
        setStep("success");
        // Redirect after a short delay
        setTimeout(() => {
          const user = data.user;
          if (user.role === "ADMIN") {
            router.push("/admin");
          } else {
            router.push("/affiliate");
          }
        }, 2000);
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
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
            <Target className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Refferq</h1>
          <p className="text-sm text-muted-foreground">
            {__tr("Affiliate Marketing Platform")}
          </p>
        </div>

        {/* Card */}
        <Card className="border-0 shadow-xl shadow-black/5">
          {step === "details" && (
            <>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">
                  {__tr("Create your account")}
                </CardTitle>
                <CardDescription>
                  {__tr("Join as an affiliate partner and start earning")}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="name">{__tr("Full Name")}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder={__tr("Your name")}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10"
                        required
                        autoFocus
                        autoComplete="name"
                      />
                    </div>
                  </div>
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
                    disabled={loading || !name || !email}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {loading
                      ? __tr("Creating account...")
                      : __tr("Create Account")}
                  </Button>
                </CardFooter>
              </form>
            </>
          )}

          {step === "otp" && (
            <>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">
                  {__tr("Verify your email")}
                </CardTitle>
                <CardDescription>
                  {__tr("Enter the 6-digit code sent to")}{" "}
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
                    {loading ? "Verifying..." : __tr("Verify & Continue")}
                  </Button>
                  <div className="flex items-center justify-between w-full">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStep("details");
                        setOtp("");
                        setError("");
                        setMessage("");
                      }}
                    >
                      <ArrowLeft className="mr-1 h-3 w-3" />
                      {__tr("Back")}
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

          {step === "success" && (
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {__tr("Welcome aboard,")} {name}!
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {__tr(
                      "Your account has been created. Redirecting to your dashboard...",
                    )}
                  </p>
                </div>
                <div className="flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Footer */}
        {step !== "success" && (
          <p className="text-center text-sm text-muted-foreground">
            {__tr("Already have an account?")}{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              {__tr("Sign in")}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
