"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { M3uExtractor, type ExtractedProfile } from "@/components/shared/m3u-extractor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, KeyRound, RefreshCw, Link2 } from "lucide-react";
import { toast } from "sonner";
import { generateActivationCode } from "@/lib/m3u-parser";

export default function CreateActivationCodePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [code, setCode] = useState("");
  const [profile, setProfile] = useState<ExtractedProfile | null>(null);

  useEffect(() => {
    setCode(generateActivationCode());
  }, []);

  const regenerateCode = () => {
    setCode(generateActivationCode());
    toast.success("New code generated");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      toast.error("Extract an M3U link first to link a credential profile");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/activation-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          profileId: profile.profileId,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to create");
      }
      toast.success("Activation code created successfully");
      router.push("/activation-codes");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create activation code";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="Create Activation Code" description="Generate a new activation code" />

      <div className="max-w-2xl mx-auto space-y-6">
        <M3uExtractor onExtract={setProfile} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              New Activation Code
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
                <p className="text-xs text-muted-foreground">
                  Auto-generated — edit to set a custom code, or refresh.
                </p>
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
                    <p className="text-xs text-muted-foreground pt-1">
                      Future credential rotations only need a single edit on this profile —
                      every code that uses it picks up the new values automatically.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center">
                    Paste an M3U link above to extract and link a credential profile.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !profile}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Create Code
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
