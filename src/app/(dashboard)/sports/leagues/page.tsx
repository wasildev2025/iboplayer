"use client";

import { useState } from "react";
import { useCrud } from "@/hooks/use-crud";
import { PageHeader } from "@/components/shared/page-header";
import { DeleteDialog } from "@/components/shared/delete-dialog";
import { Button } from "@/components/ui/button";
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
import { Plus, Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { LEAGUE_OPTIONS } from "@/types";

interface League {
  id: number;
  leagueName: string;
  leagueId: string;
}

export default function LeaguesPage() {
  const { data, isLoading, create, remove } = useCrud<League>("leagues");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState(LEAGUE_OPTIONS[0]?.id || "");

  const openCreate = () => {
    setSelectedLeague(LEAGUE_OPTIONS[0]?.id || "");
    setSheetOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const league = LEAGUE_OPTIONS.find((l) => l.id === selectedLeague);
    if (!league) return;
    try {
      await create.mutateAsync({
        leagueName: league.name,
        leagueId: league.id,
      });
      toast.success("League added successfully");
      setSheetOpen(false);
    } catch {
      toast.error("Failed to add league");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await remove.mutateAsync(id);
      toast.success("League deleted successfully");
    } catch {
      toast.error("Failed to delete league");
    }
  };

  return (
    <>
      <PageHeader title="Leagues" description="Manage sports leagues">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add League
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
                <TableHead>League Name</TableHead>
                <TableHead>League ID</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    No leagues added
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.leagueName}</TableCell>
                    <TableCell className="text-muted-foreground">{item.leagueId}</TableCell>
                    <TableCell>
                      <DeleteDialog onConfirm={() => handleDelete(item.id)} />
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
              <Trophy className="h-5 w-5" />
              Add League
            </SheetTitle>
            <SheetDescription>
              Select a league to add
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="league-select">League</Label>
              <select
                id="league-select"
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {LEAGUE_OPTIONS.map((league) => (
                  <option key={league.id} value={league.id}>
                    {league.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={create.isPending}
            >
              {create.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Add League
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
