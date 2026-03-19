"use client";

import { useState } from "react";
import { useCrud } from "@/hooks/use-crud";
import { PageHeader } from "@/components/shared/page-header";
import { DeleteDialog } from "@/components/shared/delete-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Loader2, Globe } from "lucide-react";
import { toast } from "sonner";

interface DnsItem {
  id: number;
  title: string;
  url: string;
}

export default function DnsPage() {
  const { data, isLoading, create, update, remove } = useCrud<DnsItem>("dns");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DnsItem | null>(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const openCreate = () => {
    setEditingItem(null);
    setTitle("");
    setUrl("");
    setSheetOpen(true);
  };

  const openEdit = (item: DnsItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setUrl(item.url);
    setSheetOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await update.mutateAsync({ id: editingItem.id, title, url } as DnsItem);
        toast.success("DNS updated successfully");
      } else {
        await create.mutateAsync({ title, url });
        toast.success("DNS created successfully");
      }
      setSheetOpen(false);
    } catch {
      toast.error("Failed to save DNS");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await remove.mutateAsync(id);
      toast.success("DNS deleted successfully");
    } catch {
      toast.error("Failed to delete DNS");
    }
  };

  return (
    <>
      <PageHeader title="DNS Settings" description="Manage DNS entries">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New DNS
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>URL</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    No DNS entries found
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell className="text-muted-foreground">{item.url}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DeleteDialog onConfirm={() => handleDelete(item.id)} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {editingItem ? "Edit DNS" : "New DNS"}
            </SheetTitle>
            <SheetDescription>
              {editingItem ? "Update the DNS entry details" : "Add a new DNS entry"}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="dns-title">Title</Label>
              <Input
                id="dns-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dns-url">URL</Label>
              <Input
                id="dns-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={create.isPending || update.isPending}
            >
              {(create.isPending || update.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {editingItem ? "Update" : "Create"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
