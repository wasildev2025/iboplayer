"use client";

import { SettingsForm } from "@/components/shared/settings-form";
import { PageHeader } from "@/components/shared/page-header";
import { RefreshCw } from "lucide-react";

export default function RemoteUpdateSettingsPage() {
  return (
    <>
      <PageHeader title="Remote Update" description="Configure remote update settings" />
      <SettingsForm
        settingsKey="remote-update"
        title="Remote Update"
        icon={<RefreshCw className="h-5 w-5" />}
        fields={[
          { name: "version", label: "Version", type: "text" },
          { name: "url", label: "Update URL", type: "text", placeholder: "https://..." },
        ]}
      />
    </>
  );
}
