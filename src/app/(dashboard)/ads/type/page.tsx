"use client";

import { SettingsForm } from "@/components/shared/settings-form";
import { PageHeader } from "@/components/shared/page-header";
import { Megaphone } from "lucide-react";

export default function AdsTypePage() {
  return (
    <>
      <PageHeader title="Ads Type" description="Choose advertisement display mode" />
      <SettingsForm
        settingsKey="ads-type"
        title="Ads Type"
        icon={<Megaphone className="h-5 w-5" />}
        fields={[
          {
            name: "adsType",
            label: "Ads Type",
            type: "select",
            options: [
              { value: "auto", label: "Auto" },
              { value: "manual", label: "Manual" },
            ],
          },
        ]}
      />
    </>
  );
}
