"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
  const [selected, setSelected] = useState<string[]>(defaultSelectedIds);

  function toggle(clubId: string, checked: boolean) {
    setSelected((prev) => {
      if (checked) {
        if (prev.length >= selectionCount) return prev;
        return [...prev, clubId];
      }
      return prev.filter((id) => id !== clubId);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        {selected.length} of {selectionCount} selected
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {clubs.map((club) => {
          const checked = selected.includes(club.id);
          const disabled = !checked && selected.length >= selectionCount;
          return (
            <div key={club.id} className="flex items-center gap-2">
              <Checkbox
                id={`${name}-${club.id}`}
                name={name}
                value={club.id}
                checked={checked}
                disabled={disabled}
                onCheckedChange={(value) => toggle(club.id, value === true)}
              />
              <Label
                htmlFor={`${name}-${club.id}`}
                className="font-normal text-foreground/90"
              >
                {club.name}
              </Label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
