"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface ExtractedProfile {
  profileId: number;
  dnsId: number;
  dnsTitle: string;
  dnsUrl: string;
  username: string;
  password: string;
}

interface M3uExtractorProps {
  /** Called once the M3U is extracted *and* upserted into a profile. */
  onExtract: (data: ExtractedProfile) => void;
  /** Optional title to attach to the profile when creating it for the first time. */
  profileTitle?: string;
  /** Override the help text under the input. */
  helpText?: string;
}

/**
 * Pastes an M3U `get.php?username=…&password=…` link, hits the server to
 * upsert (DNS + CredentialProfile), and hands the resolved profile back to
 * the caller. The same M3U pasted twice always returns the same profile.
 */
export function M3uExtractor({ onExtract, profileTitle, helpText }: M3uExtractorProps) {
  const [m3uLink, setM3uLink] = useState("");
  const [busy, setBusy] = useState(false);

  const handleExtract = async () => {
    if (!m3uLink.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/credential-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          m3uUrl: m3uLink.trim(),
          title: profileTitle ?? null,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error || "Failed to extract M3U");
        return;
      }
      const profile = (await res.json()) as {
        id: number;
        dnsId: number;
        username: string;
        password: string;
        dns: { id: number; title: string; url: string };
      };
      onExtract({
        profileId: profile.id,
        dnsId: profile.dnsId,
        dnsTitle: profile.dns.title,
        dnsUrl: profile.dns.url,
        username: profile.username,
        password: profile.password,
      });
      toast.success(`Linked to profile "${profile.dns.title}"`);
      setM3uLink("");
    } catch {
      toast.error("Failed to extract M3U");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-border p-4 bg-muted/30">
      <Label className="text-sm font-medium">M3U Extractor</Label>
      <div className="flex gap-2">
        <Input
          value={m3uLink}
          onChange={(e) => setM3uLink(e.target.value)}
          placeholder="Paste M3U link (e.g. http://host/get.php?username=…&password=…)"
          className="flex-1"
          disabled={busy}
        />
        <Button type="button" variant="secondary" onClick={handleExtract} disabled={busy}>
          {busy ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Link2 className="h-4 w-4 mr-2" />
          )}
          Extract
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {helpText ??
          "Pasting an M3U link finds or creates a credential profile. Activation codes link to the profile — rotating credentials later updates everything that uses it."}
      </p>
    </div>
  );
}
