"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { parseM3uUrl } from "@/lib/m3u-parser";
import { Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface ExtractedM3u {
  url: string;
  username: string;
  password: string;
  dnsId: number | null;
  dnsTitle: string;
}

interface M3uExtractorProps {
  onExtract: (data: ExtractedM3u) => void;
}

export function M3uExtractor({ onExtract }: M3uExtractorProps) {
  const [m3uLink, setM3uLink] = useState("");
  const [busy, setBusy] = useState(false);

  const handleExtract = async () => {
    if (!m3uLink) return;
    const parsed = parseM3uUrl(m3uLink);
    if (!parsed.url) {
      toast.error("Could not parse M3U link");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/dns/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: parsed.url }),
      });
      if (res.ok) {
        const dns = (await res.json()) as { id: number; title: string; url: string };
        onExtract({ ...parsed, dnsId: dns.id, dnsTitle: dns.title });
        toast.success(`DNS "${dns.title}" linked`);
      } else {
        onExtract({ ...parsed, dnsId: null, dnsTitle: "" });
        toast.warning("Extracted M3U but could not register DNS");
      }
    } catch {
      onExtract({ ...parsed, dnsId: null, dnsTitle: "" });
      toast.warning("Extracted M3U but DNS call failed");
    } finally {
      setBusy(false);
      setM3uLink("");
    }
  };

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-border p-4 bg-muted/30">
      <Label className="text-sm font-medium">M3U Extractor</Label>
      <div className="flex gap-2">
        <Input
          value={m3uLink}
          onChange={(e) => setM3uLink(e.target.value)}
          placeholder="Paste M3U link here..."
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
        Extracting a link also registers the DNS in the central DNS table. One DNS edit
        propagates everywhere it's used.
      </p>
    </div>
  );
}
