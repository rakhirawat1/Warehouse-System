"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Database,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Package,
  ShieldCheck,
  Users,
} from "lucide-react";

import { authClient } from "@/lib/auth/auth-client";
import Button from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { riseItem, staggerContainer, transitions } from "@/lib/motion";

const HIGHLIGHTS = [
  {
    icon: Boxes,
    title: "Inventory Management",
    description: "Track items and quantities in real time",
  },
  {
    icon: Database,
    title: "Optimized Storage",
    description: "Make the most of your space",
  },
  {
    icon: BarChart3,
    title: "Real-time Visibility",
    description: "Monitor operations and capacity",
  },
  {
    icon: Users,
    title: "Role-based Access",
    description: "Secure and controlled operations",
  },
];

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const { error } = await authClient.signIn.email({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message || "Invalid email or password");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
      <section className="relative hidden overflow-hidden bg-auth-panel lg:flex lg:h-full lg:w-1/2 lg:flex-col lg:p-10 xl:p-12">
        <div className="bg-grid-faint absolute inset-0 opacity-60" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative flex h-full flex-col"
        >
          <motion.div variants={riseItem}>
            <Link
              href="/"
              aria-label="Go to WMS home"
              className="group inline-flex items-center gap-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent transition-transform duration-200 group-hover:scale-105">
                <Package className="h-6 w-6 text-white" />
              </div>

              <div>
                <p className="text-2xl font-bold leading-none text-white">
                  WMS
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Warehouse Management System
                </p>
              </div>
            </Link>
          </motion.div>

          <div className="relative flex flex-1 flex-col justify-center py-10 xl:py-12">
            <motion.div variants={riseItem}>
              <h1 className="max-w-xl text-3xl font-bold leading-tight text-white xl:text-4xl 2xl:text-5xl">
                Smarter Warehouse
                <span className="block text-accent">Operations</span>
                <span className="block">for a Better Tomorrow</span>
              </h1>

              <p className="mt-5 max-w-md text-sm leading-6 text-slate-300 xl:text-base">
                Manage inventory, storage spaces, allocations and more — all
                in one secure platform.
              </p>
            </motion.div>

            <motion.ul
              variants={staggerContainer}
              className="mt-8 space-y-4 xl:mt-9 xl:space-y-5"
            >
              {HIGHLIGHTS.map((highlight) => {
                const Icon = highlight.icon;

                return (
                  <motion.li
                    key={highlight.title}
                    variants={riseItem}
                    className="flex items-center gap-4"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                      <Icon className="h-5 w-5 text-accent" />
                    </span>

                    <span>
                      <span className="block font-semibold text-white">
                        {highlight.title}
                      </span>

                      <span className="mt-0.5 block text-sm text-slate-400">
                        {highlight.description}
                      </span>
                    </span>
                  </motion.li>
                );
              })}
            </motion.ul>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, ...transitions.base }}
            className="relative pb-4"
          >
            <span className="block h-1 w-10 rounded-full bg-accent" />

            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-500">
              Built for modern warehouse operations
            </p>

            <p className="mt-1 font-medium text-slate-300">
              Simple. Reliable. Scalable.
            </p>
          </motion.div>
        </motion.div>
      </section>

      <section className="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-background p-5 sm:p-6 lg:h-full lg:w-1/2">
        <div className="flex w-full max-w-md flex-col items-center lg:-translate-x-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transitions.spring}
            className="w-full rounded-2xl border border-border bg-surface p-6 shadow-raised sm:p-8"
          >
            <Link
              href="/"
              aria-label="Go to WMS home"
              className="group inline-flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent transition-transform duration-200 group-hover:scale-105">
                <Package className="h-5 w-5 text-white" />
              </div>

              <div>
                <p className="text-xl font-bold leading-none text-primary">
                  WMS
                </p>

                <p className="mt-1 text-[11px] text-muted">
                  Warehouse Management System
                </p>
              </div>
            </Link>

            <h2 className="mt-7 text-3xl font-bold tracking-tight text-primary">
              Welcome back
            </h2>

            <p className="mt-1 text-sm text-muted">
              Sign in to your account to continue
            </p>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>

                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />

                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    placeholder="name@company.com"
                    className="h-12 pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>

                <div className="relative mt-1.5">
                  <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />

                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    placeholder="Enter your password"
                    className="h-12 pr-10 pl-10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted transition-colors hover:text-primary"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                  className="rounded-lg bg-danger-muted px-3 py-2.5 text-sm text-danger"
                >
                  {error}
                </motion.p>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                iconRight={!loading && <ArrowRight className="h-4 w-4" />}
                className="h-12 w-full text-base"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />

              <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure Access
              </span>

              <span className="h-px flex-1 bg-border" />
            </div>

            <p className="mt-3 text-center text-sm leading-5 text-muted">
              Accounts are created by an administrator. Ask your administrator
              for access.
            </p>
          </motion.div>

          <p className="mt-4 text-xs text-muted">
            © {new Date().getFullYear()} WMS. All rights reserved.
          </p>
        </div>
      </section>
    </main>
  );
}