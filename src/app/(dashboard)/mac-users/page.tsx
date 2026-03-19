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
import { Plus, Pencil, Loader2, Search, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface MacUser {
  id: number;
  title: string;
  macAddress: string;
  username: string;
  password: string;
  protection: string;
  url: string;
}

interface PaginatedResponse {
  data: MacUser[];
  total: number;
  page: number;
  totalPages: number;
}

export default function MacUsersPage() {
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
      const res = await fetch(`/api/mac-users?search=${encodeURIComponent(search)}&page=${page}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setResult(json);
    } catch {
      toast.error("Failed to fetch MAC users");
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/mac-users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("User deleted successfully");
      fetchData();
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const handleAddTrial = (macAddress: string) => {
    router.push(`/trials?mac=${encodeURIComponent(macAddress)}`);
  };

  return (
    <>
      <PageHeader title="MAC Users" description="Manage MAC address users">
        <Button onClick={() => router.push("/mac-users/create")}>
          <Plus className="h-4 w-4 mr-2" />
          New User
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
            placeholder="Search users..."
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
                  <TableHead>Title</TableHead>
                  <TableHead>MAC Address</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Protection</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead className="w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  result.data.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.title}</TableCell>
                      <TableCell className="font-mono text-sm">{user.macAddress}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>
                        <Badge variant={user.protection === "YES" ? "default" : "secondary"}>
                          {user.protection}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {user.url}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.push(`/mac-users/${user.id}/edit`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleAddTrial(user.macAddress)}
                            title="Add Trial"
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                          <DeleteDialog onConfirm={() => handleDelete(user.id)} />
                        </div>
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
