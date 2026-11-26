"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sanitizeText, validateProfile } from "@/lib/validation";

/** Edit display name, home city and bio (PATCH /users/me). */
export default function EditProfileDialog({ open, onOpenChange, profile, onSave }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Edit profile</DialogTitle>
        <DialogDescription>This is what other adventurers see.</DialogDescription>
        {open && profile && <ProfileForm profile={profile} onSave={onSave} />}
      </DialogContent>
    </Dialog>
  );
}

function ProfileForm({ profile, onSave }) {
  const [form, setForm] = useState({
    display_name: profile.display_name ?? "",
    home_city: profile.home_city ?? "",
    bio: profile.bio ?? "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const clean = {
      display_name: sanitizeText(form.display_name, 100) || null,
      home_city: sanitizeText(form.home_city, 100) || null,
      bio: sanitizeText(form.bio, 500) || null,
    };
    const problem = validateProfile(clean);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(clean);
    } catch (err) {
      setError(err?.message || "Could not save your profile.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-name">Display name</Label>
        <Input id="profile-name" value={form.display_name} onChange={set("display_name")} maxLength={100} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-city">Home city</Label>
        <Input id="profile-city" value={form.home_city} onChange={set("home_city")} maxLength={100} placeholder="San Diego, CA" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-bio">Bio</Label>
        <Textarea id="profile-bio" value={form.bio} onChange={set("bio")} maxLength={500} />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={saving}>
        {saving ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}
