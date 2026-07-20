"use client";

import { Button } from "@/components/ui/button";
import { ArrowsClockwise } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleRefresh}
      className="shrink-0 text-foreground h-9 w-9"
      disabled={isPending}
    >
      <ArrowsClockwise
        weight="bold"
        className={isPending ? "animate-spin" : ""}
      />
    </Button>
  );
}
