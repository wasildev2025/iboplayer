"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, FileText, CheckCircle2, AlertCircle, MinusCircle } from "lucide-react";
import { toast } from "sonner";

interface RowResult {
  line: number;
  code: string;
  status: "created" | "skipped" | "failed";
  profileId?: number;
  error?: string;
}

interface ImportResponse {
  summary: { total: number; created: number; skipped: number; failed: number };
  results: RowResult[];
}

const SAMPLE = `# Sample CSV — header is required
# Use either m3uUrl OR profileId column (not both)
code,m3uUrl
ABC123,http://provider.com/get.php?username=u1&password=p1&type=m3u_plus
ABC456,http://provider.com/get.php?username=u2&password=p2&type=m3u_plus`;

export default function BulkImportPage() {
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setCsv(String(e.target?.result || ""));
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!csv.trim()) {
      toast.error("Paste or upload a CSV first");
      return;
    }
    setIsUploading(true);
    setResult(null);
    try {
      const res = await fetch("/api/activation-codes/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Import failed");
      }
      const data: ImportResponse = await res.json();
      setResult(data);
      toast.success(
        `Created ${data.summary.created} of ${data.summary.total} codes`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Bulk Import Activation Codes"
        description="Upload or paste a CSV to create many activation codes at once."
      >
        <Button variant="outline" onClick={() => router.push("/activation-codes")}>
          Back to codes
        </Button>
      </PageHeader>

      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              CSV Input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
                className="text-sm"
                disabled={isUploading}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCsv(SAMPLE)}
              >
                Insert sample
              </Button>
            </div>
            <textarea
              className="w-full min-h-[240px] font-mono text-xs rounded-md border bg-background px-3 py-2"
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder="code,m3uUrl&#10;ABC123,http://..."
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground">
              Header row is required. Use <code>code,m3uUrl</code> to extract a
              new credential profile per row, or <code>code,profileId</code> to
              link many codes to an existing profile. Lines starting with{" "}
              <code>#</code> are ignored.
            </p>
            <Button
              onClick={handleSubmit}
              disabled={isUploading || !csv.trim()}
              className="w-full"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Import
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap text-sm">
                <Badge variant="secondary">
                  Total {result.summary.total}
                </Badge>
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Created {result.summary.created}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <MinusCircle className="h-3 w-3" />
                  Skipped {result.summary.skipped}
                </Badge>
                {result.summary.failed > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Failed {result.summary.failed}
                  </Badge>
                )}
              </div>

              <div className="rounded-md border max-h-[360px] overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2">Line</th>
                      <th className="text-left px-3 py-2">Code</th>
                      <th className="text-left px-3 py-2">Status</th>
                      <th className="text-left px-3 py-2">Profile</th>
                      <th className="text-left px-3 py-2">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((r) => (
                      <tr key={r.line} className="border-t">
                        <td className="px-3 py-1.5 font-mono">{r.line}</td>
                        <td className="px-3 py-1.5 font-mono">{r.code || "—"}</td>
                        <td className="px-3 py-1.5">
                          <Badge
                            variant={
                              r.status === "created"
                                ? "default"
                                : r.status === "skipped"
                                  ? "outline"
                                  : "destructive"
                            }
                          >
                            {r.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-1.5">
                          {r.profileId ? `#${r.profileId}` : "—"}
                        </td>
                        <td className="px-3 py-1.5 text-red-600 dark:text-red-400">
                          {r.error || ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
