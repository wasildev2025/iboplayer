"use client";

import { SettingsForm } from "@/components/shared/settings-form";
import { PageHeader } from "@/components/shared/page-header";
import { Trophy } from "lucide-react";

export default function SportsEventsPage() {
  return (
    <>
      <PageHeader title="Sports Events" description="Configure sports event display settings" />
      <SettingsForm
        settingsKey="sports"
        title="Sports Events"
        icon={<Trophy className="h-5 w-5" />}
        fields={[
          { name: "api", label: "API URL", type: "text", placeholder: "https://..." },
          { name: "headerName", label: "Header Name", type: "text" },
          { name: "borderColor", label: "Border Color", type: "color" },
          { name: "bgColor", label: "Background Color", type: "color" },
          { name: "textColor", label: "Text Color", type: "color" },
        ]}
      />
    </>
  );
}
