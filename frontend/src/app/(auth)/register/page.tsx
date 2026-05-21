"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { signUpWithEmail, signInWithGoogle } from "@/lib/firebase";
import { api } from "@/lib/api";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      const userCred = await signUpWithEmail(data.email, data.password);
      const token = await userCred.user.getIdToken();
      localStorage.setItem("firebaseToken", token);
      await api.post("/auth/sync");
      toast.success("Account created successfully");
      router.push("/dashboard");
    } catch (error: unknown) {
      if (error instanceof Error && "response" in error) {
        const axiosErr = error as { response?: { data?: { error?: string } } };
        toast.error(axiosErr.response?.data?.error || error.message);
      } else {
        const errMsg = error instanceof Error ? error.message : "Registration failed";
        if (errMsg.includes("too-many-requests")) {
          toast.error("Too many attempts. Please try again in a few minutes.");
        } else {
          toast.error(errMsg);
        }
      }
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      const token = await result.user.getIdToken();
      localStorage.setItem("firebaseToken", token);
      await api.post("/auth/sync");
      toast.success("Account created successfully");
      router.push("/dashboard");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Registration failed";
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-50">
      <Card className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-black"
          >
            FOURI.IN
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900 mt-4">
            Create Account
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Start practicing with AI-generated mock tests
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register("email")}
            className="text-black placeholder:text-black"
          />
          <div className="relative">
            <Input
              id="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 6 characters"
              error={errors.password?.message}
              {...register("password")}
              className="text-black placeholder:text-black pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-zinc-400 hover:text-zinc-600 cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <Button type="submit" loading={isSubmitting} className="w-full">
            Create Account
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-zinc-500">or</span>
          </div>
        </div>

        <Button
          variant="secondary"
          className="w-full"
          onClick={handleGoogleRegister}
          loading={googleLoading}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        <div className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium hover:text-zinc-900">
            Login
          </Link>
        </div>
      </Card>
    </div>
  );
}
