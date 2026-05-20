"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { resetPassword } from "@/lib/firebase";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations";
import { toast } from "sonner";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async () => {
    const email = getValues("email");
    try {
      await resetPassword(email);
      setSent(true);
      toast.success("Reset link sent to your email");
    } catch {
      toast.error("Failed to send reset email");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-50">
      <Card className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link href="/" className="text-xl font-bold tracking-tight">
            FOURI.IN
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900 mt-4">
            Reset Password
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {sent ? (
          <div className="text-center text-sm text-zinc-600">
            <p>
              Check your inbox at <strong>{getValues("email")}</strong> for the
              password reset link.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block font-medium text-zinc-900 hover:underline"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <Button type="submit" loading={isSubmitting} className="w-full">
              Send Reset Link
            </Button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/login" className="hover:text-zinc-900">
            Back to Login
          </Link>
        </div>
      </Card>
    </div>
  );
}
