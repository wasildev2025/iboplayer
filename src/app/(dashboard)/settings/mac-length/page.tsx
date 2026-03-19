"use client";

import { SettingsForm } from "@/components/shared/settings-form";
import { PageHeader } from "@/components/shared/page-header";
import { Ruler } from "lucide-react";
import { MAC_LENGTH_OPTIONS } from "@/types";

export default function MacLengthSettingsPage() {
  return (
    <>
      <PageHeader title="MAC Length" description="Configure MAC address length" />
      <SettingsForm
        settingsKey="mac-length"
        title="MAC Length"
        icon={<Ruler className="h-5 w-5" />}
        fields={[
          {
            name: "length",
            label: "MAC Address Length",
            type: "select",
            options: MAC_LENGTH_OPTIONS.map((opt) => ({
              value: String(opt.value),
              label: opt.label,
            })),
          },
        ]}
      />
    </>
  );
}
