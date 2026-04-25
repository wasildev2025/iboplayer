"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, UserCog, Tv } from "lucide-react";
import { toast } from "sonner";

interface PlaylistRow {
  id: number;
  title: string | null;
  protection: boolean;
  profile: {
    id: number;
    title: string | null;
    username: string;
    dns: { title: string; url: string };
  };
}

interface MacUserData {
  id: number;
  macAddress: string;
  title: string;
  playlists: PlaylistRow[];
}

export default function EditMacUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<MacUserData | null>(null);
  const [macAddress, setMacAddress] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/mac-users/${id}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const json: MacUserData = await res.json();
        setData(json);
        setMacAddress(json.macAddress);
        setTitle(json.title);
      } catch {
        toast.error("Failed to load device");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/mac-users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ macAddress: macAddress.trim(), title: title.trim() }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Device updated");
      router.push("/mac-users");
    } catch {
      toast.error("Failed to update device");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={data.title || "Edit Device"}
        description={data.macAddress}
      />

      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Device Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="macAddress">MAC Address</Label>
                <Input
                  id="macAddress"
                  value={macAddress}
                  onChange={(e) => setMacAddress(e.target.value)}
                  placeholder="XX:XX:XX:XX:XX:XX"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Living Room Box"
                />
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tv className="h-5 w-5" />
              Attached Playlists
              <Badge variant="secondary" className="ml-2">
                {data.playlists.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.playlists.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                This device hasn&apos;t activated any playlists yet.
              </p>
            ) : (
              <div className="space-y-2">
                {data.playlists.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {p.title || p.profile.title || p.profile.dns.title}
                      </div>
                      <div className="text-xs text-muted-foreground truncate font-mono">
                        {p.profile.dns.url} · {p.profile.username}
                      </div>
                    </div>
                    {p.protection && <Badge variant="outline">Protected</Badge>}
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              Each playlist resolves its credentials through its linked profile —
              edit the profile (under Credential Profiles) to rotate them everywhere.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
