"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { M3uExtractor, type ExtractedM3u } from "@/components/shared/m3u-extractor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, KeyRound, RefreshCw, Link2 } from "lucide-react";
import { toast } from "sonner";
import { generateActivationCode } from "@/lib/m3u-parser";

export default function EditActivationCodePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    code: "",
    url: "",
    username: "",
    password: "",
    status: "NotUsed",
    dnsId: null as number | null,
    dnsTitle: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/activation-codes/${id}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setForm({
          code: data.code || "",
          url: data.url || "",
          username: data.username || "",
          password: data.password || "",
          status: data.status || "NotUsed",
          dnsId: data.dnsId ?? null,
          dnsTitle: data.dns?.title ?? "",
        });
      } catch {
        toast.error("Failed to load activation code");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const updateField = (field: string, value: string) => {
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
    setForm((prev) => ({ ...prev, url: value, dnsId: null, dnsTitle: "" }));
  };

  const regenerateCode = () => {
    setForm((prev) => ({ ...prev, code: generateActivationCode() }));
    toast.success("New code generated");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/activation-codes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          url: form.url,
          username: form.username,
          password: form.password,
          status: form.status,
          dnsId: form.dnsId,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to update");
      }
      toast.success("Activation code updated");
      router.push("/activation-codes");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to update";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Edit Activation Code" description="Update code, DNS, or credentials" />

      <div className="max-w-2xl mx-auto space-y-6">
        <M3uExtractor onExtract={handleExtract} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Edit Activation Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Activation Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={form.code}
                    onChange={(e) => updateField("code", e.target.value)}
                    className="font-mono flex-1"
                    required
                  />
                  <Button type="button" variant="outline" onClick={regenerateCode}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Edit to set a custom code, or regenerate a new one.
                </p>
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
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => updateField("status", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="NotUsed">NotUsed</option>
                  <option value="Used">Used</option>
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
