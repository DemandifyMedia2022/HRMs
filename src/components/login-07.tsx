"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { JSX, SVGProps, useState } from "react";
import type React from "react";
import Image from "next/image";

const GoogleIcon = (
  props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>
) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M3.06364 7.50914C4.70909 4.24092 8.09084 2 12 2C14.6954 2 16.959 2.99095 18.6909 4.60455L15.8227 7.47274C14.7864 6.48185 13.4681 5.97727 12 5.97727C9.39542 5.97727 7.19084 7.73637 6.40455 10.1C6.2045 10.7 6.09086 11.3409 6.09086 12C6.09086 12.6591 6.2045 13.3 6.40455 13.9C7.19084 16.2636 9.39542 18.0227 12 18.0227C13.3454 18.0227 14.4909 17.6682 15.3864 17.0682C16.4454 16.3591 17.15 15.3 17.3818 14.05H12V10.1818H21.4181C21.5364 10.8363 21.6 11.5182 21.6 12.2273C21.6 15.2727 20.5091 17.8363 18.6181 19.5773C16.9636 21.1046 14.7 22 12 22C8.09084 22 4.70909 19.7591 3.06364 16.4909C2.38638 15.1409 2 13.6136 2 12C2 10.3864 2.38638 8.85911 3.06364 7.50914Z" />
  </svg>
);

const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <Image
    src="/HRMS-Logo.svg"
    alt="HRMS Logo"
    width={74}
    height={74}
    className={className}
    priority
  />
);

interface Login07Props {
  email: string;
  password: string;
  loading: boolean;
  error?: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function Login07({
  email,
  password,
  loading,
  error,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: Login07Props) {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const toggleVisibility = () => setIsVisible((prevState) => !prevState);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 bg-slate-900/40 "
      style={{
        backgroundImage: 'url("/loginbg.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="mx-auto w-full max-w-5xl grid gap-10 md:grid-cols-2 items-center rounded-2xl border bg-background/70 backdrop-blur-lg p-6 md:p-10 shadow-lg ">
        <div className="space-y-5 md:space-y-7">
          <p className="text-sm font-medium tracking-wide text-primary uppercase">
            Human Resource Management System
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Manage your people, payroll and performance in one place.
          </h2>
          <p className="text-muted-foreground max-w-xl">
            Streamline onboarding, attendance, leave requests and more with a secure HRMs built for growing teams.
          </p>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg border bg-background/60 p-3">
              <p className="font-medium">Role-based dashboards</p>
              <p className="text-muted-foreground">Dedicated views for Admin, HR and Employees.</p>
            </div>
            <div className="rounded-lg border bg-background/60 p-3">
              <p className="font-medium">Secure access</p>
              <p className="text-muted-foreground">Session-based authentication with protected pages.</p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm mx-auto">
          <div className="space-y-6 rounded-xl border bg-background p-6 shadow-sm">
            <div className="space-y-2 text-center">
              <Logo className="mx-auto h-20 w-20" />
              <h1 className="text-3xl font-semibold text-primary">Welcome back</h1>
              <p className="text-muted-foreground">
                Sign in to access  HRMs.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative mt-2.5">
                    <Input
                      id="email"
                      className="peer ps-9"
                      placeholder="Enter Username"
                      type="email"
                      value={email}
                      onChange={(e) => onEmailChange(e.target.value)}
                      required
                    />
                    <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                      <Mail size={16} aria-hidden="true" />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <a href="/forgot-password" className="text-sm text-primary hover:underline">
                      Forgot Password?
                    </a>
                  </div>
                  <div className="relative mt-2.5">
                    <Input
                      id="password"
                      className="ps-9 pe-9"
                      placeholder="Enter your password"
                      type={isVisible ? "text" : "password"}
                      value={password}
                      onChange={(e) => onPasswordChange(e.target.value)}
                      required
                    />
                    <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                      <Lock size={16} aria-hidden="true" />
                    </div>
                    <button
                      className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                      type="button"
                      onClick={toggleVisibility}
                      aria-label={isVisible ? "Hide password" : "Show password"}
                      aria-pressed={isVisible}
                      aria-controls="password"
                    >
                      {isVisible ? (
                        <EyeOff size={16} aria-hidden="true" />
                      ) : (
                        <Eye size={16} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Checkbox id="remember-me" />
                  <Label htmlFor="remember-me">Remember</Label>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600">
                  {error}
                </p>
              )}

              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
