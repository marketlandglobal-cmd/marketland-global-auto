import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Shown once per app entry (per browser tab session).
 */
const SEEN_KEY = "mlg-review-notice-seen";

export function ReviewNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SEEN_KEY) === "1") return;
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* storage unavailable — still show the notice */
    }
    setOpen(true);
  }, []);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="fixed left-1/2 top-1/2 max-w-sm -translate-x-1/2 -translate-y-1/2">
        <AlertDialogHeader>
          <span className="grid size-11 place-items-center rounded-xl bg-secondary">
            <ShieldAlert className="size-5 text-primary" />
          </span>
          <AlertDialogTitle>App under Play Store review</AlertDialogTitle>
          <AlertDialogDescription>
            This app is currently under review by the Google Play Store. Any funny movement or
            suspicious activity can be detected, and immediate blocking of the app is allowed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction asChild>
            <Button variant="hero" className="w-full">
              I understand
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
