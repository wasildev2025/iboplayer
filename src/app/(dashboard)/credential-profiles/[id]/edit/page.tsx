"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Save,
  Link2,
  Sparkles,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { parseM3uUrl } from "@/lib/m3u-parser";

interface ProfileData {
  id: number;
  title: string | null;
  dnsId: number;
  username: string;
  password: string;
  dns: { id: number; title: string; url: string };
  _count: { activationCodes: number; playlists: number };
}

interface ParsedM3u {
  url: string;
  username: string;
  password: string;
}

export default function EditCredentialProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  // Manual fields
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // M3U replace flow
  const [m3uLink, setM3uLink] = useState("");
  const [pendingReplace, setPendingReplace] = useState<ParsedM3u | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/credential-profiles/${id}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data: ProfileData = await res.json();
        setProfile(data);
        setTitle(data.title || "");
        setUsername(data.username);
        setPassword(data.password);
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const handlePreviewReplace = () => {
    const parsed = parseM3uUrl(m3uLink.trim());
    if (!parsed.url || !parsed.username || !parsed.password) {
      toast.error("Could not parse M3U link");
      return;
    }
    setPendingReplace(parsed);
  };

  const handleConfirmReplace = async () => {
    if (!pendingReplace || !profile) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/credential-profiles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          m3uUrl: m3uLink.trim(),
          title: title.trim() || null,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to replace credentials");
      }
      const updated = await res.json();
      toast.success(
        `Credentials rotated — ${profile._count.activationCodes} codes and ${profile._count.playlists} playlists now use the new bundle.`
      );
      // Re-load fresh state instead of trusting stale local copy
      setProfile({
        ...profile,
        ...updated,
        dns: updated.dns,
      });
      setUsername(updated.username);
      setPassword(updated.password);
      setM3uLink("");
      setPendingReplace(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to replace credentials";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveManual = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/credential-profiles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dnsId: profile.dnsId,
          username,
          password,
          title: title.trim() || null,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to save");
      }
      toast.success("Profile updated");
      router.push("/credential-profiles");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const usage = profile._count.activationCodes + profile._count.playlists;

  return (
    <>
      <PageHeader
        title={profile.title || `Profile #${profile.id}`}
        description="Editing this profile updates every activation code and playlist that links to it."
      />

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Usage summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="secondary" className="text-sm">
                {profile._count.activationCodes} activation codes
              </Badge>
              <Badge variant="outline" className="text-sm">
                {profile._count.playlists} playlists
              </Badge>
              <span className="text-sm text-muted-foreground">
                will be affected by changes here
              </span>
            </div>
          </CardContent>
        </Card>

        {/* M3U Replace flow */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Rotate Credentials from New M3U
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="m3u">New M3U Link</Label>
              <div className="flex gap-2">
                <Input
                  id="m3u"
                  value={m3uLink}
                  onChange={(e) => {
                    setM3uLink(e.target.value);
                    setPendingReplace(null);
                  }}
                  placeholder="Paste new M3U link to rotate this profile..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handlePreviewReplace}
                  disabled={!m3uLink.trim()}
                >
                  Preview Diff
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                We&apos;ll show the diff before applying. Confirming updates this profile in
                place — every linked code and playlist sees the new credentials immediately.
              </p>
            </div>

            {pendingReplace && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Review changes before confirming
                </div>
                <DiffRow
                  label="DNS"
                  oldValue={profile.dns.url}
                  newValue={pendingReplace.url}
                />
                <DiffRow
                  label="Username"
                  oldValue={profile.username}
                  newValue={pendingReplace.username}
                />
                <DiffRow
                  label="Password"
                  oldValue={"•".repeat(Math.min(profile.password.length, 12))}
                  newValue={"•".repeat(Math.min(pendingReplace.password.length, 12))}
                  changed={profile.password !== pendingReplace.password}
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPendingReplace(null)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleConfirmReplace}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Apply to {usage} linked rows
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual edit */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Manual Edit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="(uses DNS title if blank)"
              />
            </div>
            <div className="space-y-2">
              <Label>Current DNS</Label>
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                <div className="font-medium">{profile.dns.title}</div>
                <div className="text-xs text-muted-foreground font-mono break-all">
                  {profile.dns.url}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                To change the DNS host, use the &ldquo;Rotate from M3U&rdquo; box above
                (or edit the DNS record on the DNS Settings page).
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button onClick={handleSaveManual} className="w-full" disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function DiffRow({
  label,
  oldValue,
  newValue,
  changed,
}: {
  label: string;
  oldValue: string;
  newValue: string;
  changed?: boolean;
}) {
  const isChanged = changed ?? oldValue !== newValue;
  return (
    <div className="text-xs">
      <div className="text-muted-foreground mb-1">{label}</div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div
          className={`font-mono break-all px-2 py-1 rounded ${
            isChanged ? "bg-red-500/10 text-red-700 dark:text-red-400 line-through" : "bg-muted"
          }`}
        >
          {oldValue || "—"}
        </div>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <div
          className={`font-mono break-all px-2 py-1 rounded ${
            isChanged ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium" : "bg-muted"
          }`}
        >
          {newValue || "—"}
        </div>
      </div>
    </div>
  );
}
