"use client";

import { useOptimistic, useState, useTransition } from "react";
import { SmilePlusIcon } from "lucide-react";
import { toggleReaction } from "@/server/social/mutations";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { REACTION_EMOJIS } from "@/lib/reactions";

type ReactionUser = { emoji: string; userId: string; username: string };

export function AnswerReactions({
  predictionAnswerId,
  reactions,
  currentUserId,
  currentUsername,
}: {
  predictionAnswerId: string;
  reactions: ReactionUser[];
  currentUserId: string | undefined;
  currentUsername: string | undefined;
}) {
  const [, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [optimisticReactions, applyOptimisticToggle] = useOptimistic(
    reactions,
    (state, emoji: string) => {
      const alreadyMine = state.some(
        (r) => r.emoji === emoji && r.userId === currentUserId,
      );
      if (alreadyMine) {
        return state.filter(
          (r) => !(r.emoji === emoji && r.userId === currentUserId),
        );
      }
      return [
        ...state,
        { emoji, userId: currentUserId ?? "", username: currentUsername ?? "You" },
      ];
    },
  );

  const grouped = new Map<string, ReactionUser[]>();
  for (const reaction of optimisticReactions) {
    const list = grouped.get(reaction.emoji) ?? [];
    list.push(reaction);
    grouped.set(reaction.emoji, list);
  }

  function toggle(emoji: string) {
    setPickerOpen(false);
    startTransition(async () => {
      applyOptimisticToggle(emoji);
      await toggleReaction(predictionAnswerId, emoji);
    });
  }

  return (
    <>
      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            title="Add reaction"
            className={cn(
              "absolute top-1.5 right-1.5 rounded-full border bg-card p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted hover:text-foreground",
              pickerOpen && "opacity-100 bg-muted text-foreground",
            )}
          >
            <SmilePlusIcon className="size-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="flex w-fit gap-1 p-1.5" align="end">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => toggle(emoji)}
              className="rounded-md px-1.5 py-1 text-base hover:bg-muted"
            >
              {emoji}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      {grouped.size > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {[...grouped.entries()].map(([emoji, users]) => {
            const mine = users.some((u) => u.userId === currentUserId);
            return (
              <Tooltip key={emoji}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => toggle(emoji)}
                    className={cn(
                      "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
                      mine
                        ? "border-primary/40 bg-primary/10"
                        : "border-border bg-muted/50 hover:bg-muted",
                    )}
                  >
                    <span>{emoji}</span>
                    <span className="text-muted-foreground">{users.length}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {users.map((u) => u.username).join(", ")}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      )}
    </>
  );
}
