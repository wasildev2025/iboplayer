"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { M3uExtractor, type ExtractedM3u } from "@/components/shared/m3u-extractor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, UserPlus, Link2 } from "lucide-react";
import { toast } from "sonner";

export default function CreateMacUserPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    macAddress: "",
    protection: false,
    title: "",
    url: "",
    username: "",
    password: "",
    dnsId: null as number | null,
    dnsTitle: "",
  });

  const updateField = (field: string, value: string | boolean | number | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleExtract = (data: ExtractedM3u) => {
    setForm((prev) => ({
      ...prev,
      url: data.url,
      username: data.username,
      password: data.password,
      dnsId: data.dnsId,
      dnsTitle: data.dnsTitle,
    }));
    toast.success("M3U data extracted");
  };

  const handleUrlChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      url: value,
      // Manual edit breaks the DNS link — the user is entering a raw URL.
      dnsId: null,
      dnsTitle: "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/mac-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          macAddress: form.macAddress,
          protection: form.protection,
          title: form.title,
          url: form.url,
          username: form.username,
          password: form.password,
          dnsId: form.dnsId,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      toast.success("MAC user created successfully");
      router.push("/mac-users");
    } catch {
      toast.error("Failed to create MAC user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="Create MAC User" description="Add a new MAC address user" />

      <div className="max-w-2xl mx-auto space-y-6">
        <M3uExtractor onExtract={handleExtract} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              New MAC User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="macAddress">MAC Address</Label>
                <Input
                  id="macAddress"
                  value={form.macAddress}
                  onChange={(e) => updateField("macAddress", e.target.value)}
                  placeholder="XX:XX:XX:XX:XX:XX"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="protection">Protection</Label>
                <select
                  id="protection"
                  value={form.protection ? "YES" : "NO"}
                  onChange={(e) => updateField("protection", e.target.value === "YES")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="YES">YES</option>
                  <option value="NO">NO</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Enter title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">DNS / URL</Label>
                <Input
                  id="url"
                  value={form.url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://..."
                  required
                />
                {form.dnsId && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    Linked to DNS: <span className="font-medium">{form.dnsTitle}</span> (id {form.dnsId})
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(e) => updateField("username", e.target.value)}
                  placeholder="Enter username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Create User
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
