"use client";

import { Button } from "@/components/ui/button";

export function ConfirmSubmitButton({
  confirmMessage,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { confirmMessage: string }) {
  return (
    <Button
      {...props}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </Button>
  );
}
