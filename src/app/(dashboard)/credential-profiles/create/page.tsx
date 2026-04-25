"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { M3uExtractor, type ExtractedProfile } from "@/components/shared/m3u-extractor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Link2 } from "lucide-react";
import { toast } from "sonner";

export default function CreateCredentialProfilePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [profile, setProfile] = useState<ExtractedProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!profile) {
      toast.error("Extract an M3U link first");
      return;
    }
    if (!title.trim()) {
      // The extractor already created the profile during M3U upsert. If the
      // user wants to set a label, persist it now via a PUT.
      router.push("/credential-profiles");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/credential-profiles/${profile.profileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          dnsId: profile.dnsId,
          username: profile.username,
          password: profile.password,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to save title");
      }
      toast.success("Profile saved");
      router.push("/credential-profiles");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save title";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Create Credential Profile"
        description="Extract from an M3U link, then optionally label it."
      />

      <div className="max-w-2xl mx-auto space-y-6">
        <M3uExtractor
          onExtract={(p) => {
            setProfile(p);
            if (!title) setTitle(p.dnsTitle);
          }}
          profileTitle={title || undefined}
          helpText="The (DNS, username, password) bundle from this M3U is upserted as a credential profile. Pasting the same M3U twice returns the same profile — no duplicates."
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Profile Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Provider X — Premium"
              />
              <p className="text-xs text-muted-foreground">
                Shown in the profiles list and on the DNS Settings page (when
                this is the only profile on this host). Defaults to the DNS
                title if left blank.
              </p>
            </div>

            {profile && (
              <div className="rounded-lg border bg-muted/30 px-3 py-3 space-y-1 text-sm">
                <div className="font-medium">Profile #{profile.profileId}</div>
                <div className="text-muted-foreground text-xs grid grid-cols-[80px_1fr] gap-x-3 gap-y-1">
                  <span>DNS</span>
                  <span className="font-medium">{profile.dnsTitle}</span>
                  <span>URL</span>
                  <span className="font-mono break-all">{profile.dnsUrl}</span>
                  <span>Username</span>
                  <span className="font-mono">{profile.username}</span>
                  <span>Password</span>
                  <span className="font-mono">
                    {"•".repeat(Math.min(profile.password.length, 12))}
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handleSave}
              className="w-full"
              disabled={!profile || isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {title.trim() ? "Save Title & Finish" : "Finish"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
