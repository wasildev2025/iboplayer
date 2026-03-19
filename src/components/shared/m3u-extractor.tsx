"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { parseM3uUrl } from "@/lib/m3u-parser";
import { Link2 } from "lucide-react";

interface M3uExtractorProps {
  onExtract: (data: { url: string; username: string; password: string }) => void;
}

export function M3uExtractor({ onExtract }: M3uExtractorProps) {
  const [m3uLink, setM3uLink] = useState("");

  const handleExtract = () => {
    if (!m3uLink) return;
    const parsed = parseM3uUrl(m3uLink);
    onExtract(parsed);
    setM3uLink("");
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
        />
        <Button type="button" variant="secondary" onClick={handleExtract}>
          <Link2 className="h-4 w-4 mr-2" />
          Extract
        </Button>
      </div>
    </div>
  );
}
