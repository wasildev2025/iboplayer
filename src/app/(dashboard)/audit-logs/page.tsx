"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, ChevronLeft, ChevronRight, Search, FileClock } from "lucide-react";
import { toast } from "sonner";

interface LogRow {
  id: number;
  actorId: number | null;
  actorName: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
}

interface Page {
  data: LogRow[];
  page: number;
  total: number;
  totalPages: number;
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<Page>({ data: [], page: 1, total: 0, totalPages: 1 });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL("/api/audit-logs", window.location.origin);
      url.searchParams.set("page", String(page));
      if (action) url.searchParams.set("action", action);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      setResult(await res.json());
    } catch {
      toast.error("Failed to fetch audit logs");
    } finally {
      setIsLoading(false);
    }
  }, [page, action]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <>
      <PageHeader
        title="Audit Logs"
        description="Append-only history of admin actions. Read-only."
      />

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
            placeholder="Filter by action prefix (e.g. profile.)"
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Metadata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      <FileClock className="h-6 w-6 mx-auto mb-2 opacity-40" />
                      No audit entries yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  result.data.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                        {new Date(r.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm">{r.actorName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {r.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.targetType
                          ? `${r.targetType} ${r.targetId ? `#${r.targetId}` : ""}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {r.ip || "—"}
                      </TableCell>
                      <TableCell className="text-xs font-mono max-w-[280px] truncate">
                        {r.metadata ? JSON.stringify(r.metadata) : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Page {result.page} of {result.totalPages} ({result.total} total)
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button variant="outline" size="sm"
                disabled={page >= result.totalPages}
                onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
