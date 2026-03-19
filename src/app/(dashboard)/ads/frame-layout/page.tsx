"use client";

import { useState, useEffect } from "react";
import { SettingsForm } from "@/components/shared/settings-form";
import { PageHeader } from "@/components/shared/page-header";
import { LayoutGrid } from "@/components/shared/layout-grid";
import { useSettings } from "@/hooks/use-settings";
import { Frame } from "lucide-react";
import { FRAME_LAYOUT_OPTIONS } from "@/types";
import { toast } from "sonner";

export default function FrameLayoutPage() {
  const { data, save } = useSettings<{ layout: string }>("frame-layout");
  const [selectedLayout, setSelectedLayout] = useState("");

  useEffect(() => {
    if (data?.layout) {
      setSelectedLayout(data.layout);
    }
  }, [data]);

  const handleLayoutChange = async (value: string) => {
    setSelectedLayout(value);
    try {
      await save.mutateAsync({ layout: value });
      toast.success("Layout updated successfully");
    } catch {
      toast.error("Failed to update layout");
    }
  };

  return (
    <>
      <PageHeader title="Frame Layout" description="Choose frame ad layout" />
      <SettingsForm
        settingsKey="frame-layout"
        title="Frame Layout"
        icon={<Frame className="h-5 w-5" />}
        fields={[
          {
            name: "layout",
            label: "Layout",
            type: "select",
            options: FRAME_LAYOUT_OPTIONS,
          },
        ]}
      />
      <div className="max-w-4xl mx-auto mt-6">
        <LayoutGrid
          options={FRAME_LAYOUT_OPTIONS.map((l) => ({
            value: l.value,
            label: l.label,
            image: `/layouts/frame/${l.value}.png`,
          }))}
          value={selectedLayout}
          onChange={handleLayoutChange}
          columns={3}
        />
      </div>
    </>
  );
}
