"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Store,
  PackageSearch,
  Receipt,
  BarChart3,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useLoginMutation } from "@/hooks/useAuthMutations";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

const features = [
  { icon: PackageSearch, label: "Real-time inventory tracking" },
  { icon: Receipt, label: "Fast POS & billing" },
  { icon: BarChart3, label: "Sales & profit reports" },
];

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  const { mutate: login, isPending: loading } = useLoginMutation();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "", rememberMe: false },
  });

  // Load remembered username on mount
  useEffect(() => {
    const rememberedUsername = localStorage.getItem("rememberedUsername");
    if (rememberedUsername) {
      form.setValue("username", rememberedUsername);
      form.setValue("rememberMe", true);
    }
  }, [form]);

  function onSubmit({ username, password, rememberMe }) {
    setLoginError("");

    // Save or clear remembered username
    if (rememberMe) {
      localStorage.setItem("rememberedUsername", username);
    } else {
      localStorage.removeItem("rememberedUsername");
    }

    login(
      { username, password },
      {
        onSuccess: (data) => {
          console.log("Login success, showing toast...");
          toast("Welcome back! 👋", {
            description: `Logged in as ${data?.data?.user?.username || "User"}. Redirecting...`,
            duration: 3000,
          });
          setTimeout(() => router.push("/dashboard"), 1500);
        },
        onError: (err) => {
          const msg =
            err?.response?.data?.message ||
            "Invalid credentials. Please try again.";
          console.log("Login error, showing toast:", msg);
          setLoginError(msg);
          toast.error("Login Failed", {
            description: msg,
            duration: 4000,
          });
        },
      }
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col w-[55%] bg-primary text-primary-foreground relative overflow-hidden px-12 py-10">
        <svg
          className="absolute inset-0 w-full h-full opacity-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="login-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-grid)" />
          <circle cx="20%" cy="30%" r="180" fill="currentColor" opacity="0.08" />
          <circle cx="75%" cy="70%" r="240" fill="currentColor" opacity="0.06" />
        </svg>

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-foreground/15">
              <Store className="size-7" />
            </div>
            <span className="text-3xl font-bold tracking-tight">ShopOS</span>
          </div>

          <div className="mt-16">
            <h1 className="text-4xl font-bold leading-tight">
              Smart inventory &<br />POS for mobile shops
            </h1>
            <p className="mt-4 text-primary-foreground/70 text-lg">
              Everything you need to run your shop efficiently.
            </p>
          </div>

          <ul className="mt-12 space-y-5">
            {features.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary-foreground/15">
                  <Icon className="size-5" />
                </div>
                <span className="text-primary-foreground/90 font-medium">{label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-auto">
            <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground/70">
              v1.0.0
            </Badge>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <Store className="size-6 text-primary" />
            <span className="text-xl font-bold">ShopOS</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="mt-1 text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          {loginError && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>
                {loginError}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username or Email</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter your username or email"
                        autoComplete="username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          className="pr-10"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword((p) => !p)}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal cursor-pointer">
                        Remember me
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <Link
                  href="/auth/forgot-password"
                  className={cn(buttonVariants({ variant: "link" }), "px-0 h-auto text-sm")}
                >
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
                Sign In
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
