"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DeleteDialog } from "@/components/shared/delete-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Link2,
} from "lucide-react";
import { toast } from "sonner";

interface CredentialProfile {
  id: number;
  title: string | null;
  username: string;
  dns: { id: number; title: string; url: string };
  _count: { activationCodes: number; playlists: number };
}

interface PaginatedResponse {
  data: CredentialProfile[];
  total: number;
  page: number;
  totalPages: number;
}

export default function CredentialProfilesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<PaginatedResponse>({
    data: [],
    total: 0,
    page: 1,
    totalPages: 1,
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/credential-profiles?search=${encodeURIComponent(search)}&page=${page}`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setResult(json);
    } catch {
      toast.error("Failed to fetch credential profiles");
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/credential-profiles/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to delete");
      }
      toast.success("Profile deleted");
      fetchData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to delete profile";
      toast.error(msg);
    }
  };

  return (
    <>
      <PageHeader
        title="Credential Profiles"
        description="The (DNS, username, password) bundles your activation codes and playlists link to. Edit one profile to rotate credentials everywhere."
      >
        <Button onClick={() => router.push("/credential-profiles/create")}>
          <Plus className="h-4 w-4 mr-2" />
          New Profile
        </Button>
      </PageHeader>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by DNS, username, or title..."
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
                  <TableHead>Profile</TableHead>
                  <TableHead>DNS</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No credential profiles yet — create one or extract an M3U from the activation code page.
                    </TableCell>
                  </TableRow>
                ) : (
                  result.data.map((p) => {
                    const usage = p._count.activationCodes + p._count.playlists;
                    const inUse = usage > 0;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Link2 className="h-4 w-4 text-muted-foreground" />
                            <span>{p.title || `Profile #${p.id}`}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{p.dns.title}</div>
                          <div className="text-xs text-muted-foreground font-mono truncate max-w-[260px]">
                            {p.dns.url}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{p.username}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" title="Activation codes">
                              {p._count.activationCodes} codes
                            </Badge>
                            <Badge variant="outline" title="Linked playlists">
                              {p._count.playlists} playlists
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => router.push(`/credential-profiles/${p.id}/edit`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <DeleteDialog
                              onConfirm={() => handleDelete(p.id)}
                              disabled={inUse}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Page {result.page} of {result.totalPages} ({result.total} total)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= result.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
