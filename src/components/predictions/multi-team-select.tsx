"use client";

import { useState } from "react";
import { Combobox } from "@/components/ui/combobox";

export function MultiTeamSelect({
  name,
  clubs,
  selectionCount,
  defaultSelectedIds,
}: {
  name: string;
  clubs: { id: string; name: string }[];
  selectionCount: number;
  defaultSelectedIds: string[];
}) {
  const [selected, setSelected] = useState<string[]>(() =>
    Array.from({ length: selectionCount }, (_, i) => defaultSelectedIds[i] ?? ""),
  );

  function setSlot(index: number, clubId: string) {
    setSelected((prev) => {
      const next = [...prev];
      next[index] = clubId;
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {selected.map((value, index) => {
        const takenElsewhere = selected.filter((id, i) => i !== index && id);
        const availableClubs = clubs.filter(
          (club) => club.id === value || !takenElsewhere.includes(club.id),
        );
        return (
          <div key={index} className="flex items-center gap-2">
            <span className="w-4 text-sm text-muted-foreground">
              {index + 1}.
            </span>
            <Combobox
              name={name}
              value={value}
              onValueChange={(clubId) => setSlot(index, clubId)}
              options={availableClubs}
              placeholder="Pick a team"
              searchPlaceholder="Search teams..."
            />
          </div>
        );
      })}
    </div>
  );
}
