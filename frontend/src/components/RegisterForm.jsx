"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/api/api";

const EMPTY_FORM = {
  username: "",
  email: "",
  display_name: "",
  password: "",
  confirmPassword: "",
};

/**
 * Check the form before sending it, using the same rules as the backend
 * (see backend/src/app/schemas/user.py). Returns an error message or "".
 */
export function validateRegistration(form) {
  if (!/^[A-Za-z0-9_.]{3,50}$/.test(form.username)) {
    return "Username must be 3-50 characters: letters, numbers, _ or . only.";
  }
  if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    return "Please enter a valid email address.";
  }
  if (form.password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (form.password !== form.confirmPassword) {
    return "Passwords don't match.";
  }
  return "";
}

export default function RegisterForm() {
  const { register, isAuthenticated } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  function updateField(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = { ...form, username: form.username.trim(), email: form.email.trim() };

    const problem = validateRegistration(trimmed);
    if (problem) {
      setError(problem);
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await register(trimmed); // creates the account, then logs in
      router.push("/");
    } catch (err) {
      setError(getErrorMessage(err, "Sign up failed."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Create an account</CardTitle>
        <CardDescription>Plan routes, save places and review your trips.</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="register-username">Username</Label>
            <Input
              id="register-username"
              name="username"
              autoComplete="username"
              value={form.username}
              onChange={updateField}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="register-email">Email</Label>
            <Input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={updateField}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="register-display-name">
              Display name <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="register-display-name"
              name="display_name"
              autoComplete="name"
              value={form.display_name}
              onChange={updateField}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="register-password">Password</Label>
            <Input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={updateField}
              required
            />
            <p className="text-xs text-muted-foreground">At least 8 characters.</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="register-confirm-password">Confirm password</Label>
            <Input
              id="register-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={updateField}
              required
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </CardContent>

        <CardFooter className="mt-4 flex flex-col gap-3">
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Creating account..." : "Sign up"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
              Log in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
