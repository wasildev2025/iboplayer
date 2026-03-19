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
import { Plus, Pencil, Loader2, Image } from "lucide-react";
import { toast } from "sonner";

interface ManualAd {
  id: number;
  title: string;
  imageUrl: string;
}

export default function ManualAdsPage() {
  const { data, isLoading, create, update, remove } = useCrud<ManualAd>("manual-ads");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ManualAd | null>(null);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const openCreate = () => {
    setEditingItem(null);
    setTitle("");
    setImageUrl("");
    setSheetOpen(true);
  };

  const openEdit = (item: ManualAd) => {
    setEditingItem(item);
    setTitle(item.title);
    setImageUrl(item.imageUrl);
    setSheetOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await update.mutateAsync({ id: editingItem.id, title, imageUrl } as ManualAd);
        toast.success("Ad updated successfully");
      } else {
        await create.mutateAsync({ title, imageUrl });
        toast.success("Ad created successfully");
      }
      setSheetOpen(false);
    } catch {
      toast.error("Failed to save ad");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await remove.mutateAsync(id);
      toast.success("Ad deleted successfully");
    } catch {
      toast.error("Failed to delete ad");
    }
  };

  return (
    <>
      <PageHeader title="Manual Ads" description="Manage manual advertisement entries">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Ad
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
                <TableHead>Preview</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    No manual ads found
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="h-12 w-20 object-cover rounded border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm">No image</span>
                      )}
                    </TableCell>
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
              <Image className="h-5 w-5" />
              {editingItem ? "Edit Ad" : "New Ad"}
            </SheetTitle>
            <SheetDescription>
              {editingItem ? "Update the ad details" : "Add a new manual ad"}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="ad-title">Title</Label>
              <Input
                id="ad-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter ad title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ad-image">Image URL</Label>
              <Input
                id="ad-image"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                required
              />
            </div>
            {imageUrl && (
              <div className="rounded border p-2">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-32 object-contain rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
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
