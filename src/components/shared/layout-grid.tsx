"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface LayoutOption {
  value: string;
  label: string;
  image?: string;
  description?: string;
}

interface LayoutGridProps {
  options: LayoutOption[];
  value: string;
  onChange: (value: string) => void;
  columns?: number;
}

export function LayoutGrid({ options, value, onChange, columns = 3 }: LayoutGridProps) {
  return (
    <div
      className="grid gap-4 mt-4"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "relative rounded-lg border-2 p-2 text-center transition-all hover:border-primary/50",
            value === option.value
              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
              : "border-border"
          )}
        >
          {value === option.value && (
            <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
              <Check className="h-3 w-3 text-primary-foreground" />
            </div>
          )}
          {option.image && (
            <div className="aspect-video rounded overflow-hidden mb-2 bg-muted">
              <img
                src={option.image}
                alt={option.label}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
          <p className="text-xs font-medium text-foreground">{option.label}</p>
          {option.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
          )}
        </button>
      ))}
    </div>
  );
}
