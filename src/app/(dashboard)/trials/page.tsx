"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { Plus, Pencil, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";

interface Trial {
  id: number;
  macAddress: string;
  expireDate: string;
}

export default function TrialsPage() {
  const searchParams = useSearchParams();
  const prefillMac = searchParams.get("mac") || "";

  const { data, isLoading, create, update, remove } = useCrud<Trial>("trials");
  const [sheetOpen, setSheetOpen] = useState(!!prefillMac);
  const [editingItem, setEditingItem] = useState<Trial | null>(null);
  const [macAddress, setMacAddress] = useState(prefillMac);
  const [expireDate, setExpireDate] = useState("");

  const openCreate = () => {
    setEditingItem(null);
    setMacAddress("");
    setExpireDate("");
    setSheetOpen(true);
  };

  const openEdit = (item: Trial) => {
    setEditingItem(item);
    setMacAddress(item.macAddress);
    setExpireDate(item.expireDate ? item.expireDate.split("T")[0] : "");
    setSheetOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await update.mutateAsync({
          id: editingItem.id,
          macAddress,
          expireDate,
        } as Trial);
        toast.success("Trial updated successfully");
      } else {
        await create.mutateAsync({ macAddress, expireDate });
        toast.success("Trial created successfully");
      }
      setSheetOpen(false);
    } catch {
      toast.error("Failed to save trial");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await remove.mutateAsync(id);
      toast.success("Trial deleted successfully");
    } catch {
      toast.error("Failed to delete trial");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <PageHeader title="Trials / Expiration" description="Manage trial periods and expiration dates">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Trial
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
                <TableHead>MAC Address</TableHead>
                <TableHead>Expire Date</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    No trials found
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono font-medium">{item.macAddress}</TableCell>
                    <TableCell>{formatDate(item.expireDate)}</TableCell>
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
              <Clock className="h-5 w-5" />
              {editingItem ? "Edit Trial" : "New Trial"}
            </SheetTitle>
            <SheetDescription>
              {editingItem ? "Update trial expiration" : "Set a new trial period"}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="trial-mac">MAC Address</Label>
              <Input
                id="trial-mac"
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value)}
                placeholder="XX:XX:XX:XX:XX:XX"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trial-date">Expire Date</Label>
              <Input
                id="trial-date"
                type="date"
                value={expireDate}
                onChange={(e) => setExpireDate(e.target.value)}
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
