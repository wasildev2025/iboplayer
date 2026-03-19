"use client";

import { SettingsForm } from "@/components/shared/settings-form";
import { PageHeader } from "@/components/shared/page-header";
import { Monitor } from "lucide-react";

export default function DemoSettingsPage() {
  return (
    <>
      <PageHeader title="Demo Settings" description="Configure demo playlist credentials" />
      <SettingsForm
        settingsKey="demo"
        title="Demo Settings"
        icon={<Monitor className="h-5 w-5" />}
        fields={[
          { name: "mplname", label: "Playlist Name", type: "text" },
          { name: "mdns", label: "DNS", type: "text" },
          { name: "muser", label: "Username", type: "text" },
          { name: "mpass", label: "Password", type: "text" },
        ]}
      />
    </>
  );
}
