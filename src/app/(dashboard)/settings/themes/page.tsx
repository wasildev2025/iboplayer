"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/hooks/use-settings";
import { PageHeader } from "@/components/shared/page-header";
import { THEME_OPTIONS, type ThemeOption } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check,
  Smartphone,
  Loader2,
  Sparkles,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Per-theme preview palette. Mirrors the Android `paletteFor(themeNo)`
 * mapping so the dashboard preview matches what the device will actually
 * render. Keep these two lists in lockstep.
 */
const THEME_PREVIEWS: Record<
  string,
  { primary: string; secondary: string }
> = {
  theme_orange: { primary: "#F59E29", secondary: "#E8A94A" },
  theme_blue: { primary: "#3B82F6", secondary: "#60A5FA" },
  theme_green: { primary: "#22C55E", secondary: "#4ADE80" },
};

function previewFor(value: string) {
  return (
    THEME_PREVIEWS[value] ?? { primary: "#F59E29", secondary: "#E8A94A" }
  );
}

export default function ThemeSettingsPage() {
  const { data, isLoading, save } = useSettings<{ themeNo: string }>("themes");
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);

  useEffect(() => {
    if (data?.themeNo) {
      setSelectedTheme(data.themeNo);
    }
  }, [data]);

  const handleApplyTheme = async (themeValue: string) => {
    try {
      await save.mutateAsync({ themeNo: themeValue });
      setSelectedTheme(themeValue);
      const theme = THEME_OPTIONS.find((t) => t.value === themeValue);
      toast.success(`${theme?.label} applied`, {
        description: "Theme will be pushed to Android app on next sync.",
      });
    } catch {
      toast.error("Failed to apply theme");
    }
  };

  const activeTheme = THEME_OPTIONS.find((t) => t.value === selectedTheme);
  const hoveredTheme = previewTheme
    ? THEME_OPTIONS.find((t) => t.value === previewTheme)
    : null;
  const displayTheme = hoveredTheme || activeTheme;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="App Themes"
        description="Choose a theme for your Android application. Changes are pushed to devices on next sync."
      />

      {/* Active Theme Banner */}
      <Card className="mb-6 border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-transparent to-transparent">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/20">
            <Smartphone className="h-6 w-6 text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">
              Currently Active on Android App
            </p>
            <p className="text-lg font-semibold text-foreground">
              {activeTheme?.label || "No theme selected"}
            </p>
          </div>
          {activeTheme && (
            <div className="hidden md:block shrink-0 w-48 h-28 rounded-lg overflow-hidden border border-border">
              <ThemePreview value={activeTheme.value} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Panel — shows on hover */}
      {displayTheme && (
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/2">
                <div className="relative aspect-video rounded-xl overflow-hidden border border-border">
                  <ThemePreview value={displayTheme.value} />
                  {hoveredTheme && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-black/60 text-white backdrop-blur-sm border-0">
                        <Monitor className="h-3 w-3 mr-1" />
                        Preview
                      </Badge>
                    </div>
                  )}
                  {!hoveredTheme && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-green-500/80 text-white border-0">
                        <Check className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:w-1/2 flex flex-col justify-center">
                <h3 className="text-xl font-bold mb-2">{displayTheme.label}</h3>
                <p className="text-muted-foreground mb-4">
                  {displayTheme.description}
                </p>

                {selectedTheme !== displayTheme.value ? (
                  <Button
                    onClick={() => handleApplyTheme(displayTheme.value)}
                    disabled={save.isPending}
                    className="w-fit bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/20"
                  >
                    {save.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Apply {displayTheme.label}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <Check className="h-4 w-4" />
                    Currently active theme
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Theme Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {THEME_OPTIONS.map((theme) => (
          <ThemeCard
            key={theme.value}
            theme={theme}
            isActive={selectedTheme === theme.value}
            isPending={save.isPending}
            onSelect={() => handleApplyTheme(theme.value)}
            onHover={() => setPreviewTheme(theme.value)}
            onLeave={() => setPreviewTheme(null)}
          />
        ))}
      </div>
    </>
  );
}

/**
 * Pure-CSS theme preview — gradient + accent dots, no image asset needed.
 * Matches the navy-on-dark look the device renders.
 */
function ThemePreview({ value }: { value: string }) {
  const palette = previewFor(value);
  return (
    <div
      className="w-full h-full"
      style={{
        background:
          "linear-gradient(180deg, #1A2A40 0%, #0B1320 50%, #050A14 100%)",
      }}
    >
      <div className="w-full h-full flex flex-col justify-end p-3 gap-2">
        <div className="flex gap-1.5">
          <span
            className="h-3 w-3 rounded-full"
            style={{ background: palette.primary }}
          />
          <span
            className="h-3 w-3 rounded-full"
            style={{ background: palette.secondary }}
          />
          <span
            className="h-3 w-3 rounded-full bg-white/30"
          />
        </div>
        <div
          className="h-1.5 w-2/3 rounded-full"
          style={{ background: palette.primary }}
        />
        <div className="h-1.5 w-1/2 rounded-full bg-white/20" />
        <div className="h-1.5 w-1/3 rounded-full bg-white/15" />
      </div>
    </div>
  );
}

function ThemeCard({
  theme,
  isActive,
  isPending,
  onSelect,
  onHover,
  onLeave,
}: {
  theme: ThemeOption;
  isActive: boolean;
  isPending: boolean;
  onSelect: () => void;
  onHover: () => void;
  onLeave: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      disabled={isPending && !isActive}
      className={cn(
        "group relative rounded-xl border-2 overflow-hidden text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50",
        isActive
          ? "border-orange-500 ring-2 ring-orange-500/20 shadow-lg shadow-orange-500/10"
          : "border-border hover:border-orange-500/40 hover:shadow-md"
      )}
    >
      <div className="aspect-video relative overflow-hidden">
        <ThemePreview value={theme.value} />

        {isActive && (
          <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
            <Check className="h-3.5 w-3.5 text-white" />
          </div>
        )}

        {!isActive && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-xs font-medium bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
              Click to apply
            </span>
          </div>
        )}
      </div>

      <div className="p-2.5 bg-card">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "text-sm font-medium",
              isActive ? "text-orange-400" : "text-foreground"
            )}
          >
            {theme.label}
          </span>
          {isActive && (
            <Badge
              variant="secondary"
              className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0"
            >
              Active
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
