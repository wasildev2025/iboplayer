"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { M3uExtractor, type ExtractedProfile } from "@/components/shared/m3u-extractor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, KeyRound, RefreshCw, Link2 } from "lucide-react";
import { toast } from "sonner";
import { generateActivationCode } from "@/lib/m3u-parser";

interface CodeData {
  code: string;
  status: string;
  profileId: number;
  profile: {
    id: number;
    dnsId: number;
    username: string;
    password: string;
    dns: { title: string; url: string };
  };
}

export default function EditActivationCodePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [code, setCode] = useState("");
  const [status, setStatus] = useState("NotUsed");
  const [profile, setProfile] = useState<ExtractedProfile | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/activation-codes/${id}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data: CodeData = await res.json();
        setCode(data.code || "");
        setStatus(data.status || "NotUsed");
        setProfile({
          profileId: data.profile.id,
          dnsId: data.profile.dnsId,
          dnsTitle: data.profile.dns.title,
          dnsUrl: data.profile.dns.url,
          username: data.profile.username,
          password: data.profile.password,
        });
      } catch {
        toast.error("Failed to load activation code");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const regenerateCode = () => {
    setCode(generateActivationCode());
    toast.success("New code generated");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      toast.error("Activation code must be linked to a profile");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/activation-codes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          status,
          profileId: profile.profileId,
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
      <PageHeader title="Edit Activation Code" description="Update code, status, or relink to a different credential profile" />

      <div className="max-w-2xl mx-auto space-y-6">
        <M3uExtractor
          onExtract={setProfile}
          helpText="Paste a different M3U link to relink this code to another credential profile. To rotate the credentials of the current profile (and propagate to every code using it), edit the profile directly."
        />

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
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="font-mono flex-1"
                    required
                  />
                  <Button type="button" variant="outline" onClick={regenerateCode}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Linked Credential Profile</Label>
                {profile ? (
                  <div className="rounded-lg border bg-muted/30 px-3 py-3 space-y-1 text-sm">
                    <div className="flex items-center gap-2 font-medium">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      Profile #{profile.profileId} — {profile.dnsTitle}
                    </div>
                    <div className="text-muted-foreground text-xs grid grid-cols-[80px_1fr] gap-x-3 gap-y-1">
                      <span>DNS</span>
                      <span className="font-mono break-all">{profile.dnsUrl}</span>
                      <span>Username</span>
                      <span className="font-mono">{profile.username}</span>
                      <span>Password</span>
                      <span className="font-mono">{"•".repeat(Math.min(profile.password.length, 12))}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No profile linked.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="NotUsed">NotUsed</option>
                  <option value="Used">Used</option>
                </select>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting || !profile}>
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
