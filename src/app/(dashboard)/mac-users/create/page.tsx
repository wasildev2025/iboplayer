"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, UserPlus } from "lucide-react";
import { toast } from "sonner";

/**
 * Devices auto-register on first activation via the player API. This admin
 * page exists for the rare case of pre-allocating a slot for a known MAC
 * (e.g. a hardware unit shipping before it phones home). No credentials
 * live on a device anymore — playlists carry profile FKs.
 */
export default function CreateMacUserPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [macAddress, setMacAddress] = useState("");
  const [title, setTitle] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!macAddress.trim()) {
      toast.error("MAC address is required");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/mac-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          macAddress: macAddress.trim(),
          title: title.trim(),
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to create");
      }
      toast.success("Device registered");
      router.push("/mac-users");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to register device";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Register MAC Device"
        description="Pre-allocate a device slot. Playlists are attached separately when the device activates."
      />

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              New Device
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
                <Label htmlFor="title">Title (optional)</Label>
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
                Register Device
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
