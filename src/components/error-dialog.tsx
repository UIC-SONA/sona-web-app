import {AlertDialog} from "@radix-ui/react-alert-dialog";
import {
  AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog.tsx";
import {ErrorTitle} from "@/lib/errors.ts";
import {CircleX} from "lucide-react";

export default function ErrorDialog({error, setError}: Readonly<{ error: ErrorTitle | null, setError: (error: ErrorTitle | null) => void }>) {

  return (
    <AlertDialog open={error !== null}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-error flex items-center">
            <CircleX className="h-6 w-6 text-error mr-2"/>
            {error?.title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {error?.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setError(null)}>
            Ok
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}