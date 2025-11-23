"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function ReportProductDialog({ onReport }: { onReport: (reason: string) => void }) {
    const { toast } = useToast();
    const [reason, setReason] = useState("");

    const handleReport = () => {
        onReport(reason);
        toast({
            title: "Report Submitted",
            description: "Thank you for your feedback. Our team will review this listing shortly.",
        });
    };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">Report Product</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Report this product listing?</AlertDialogTitle>
          <AlertDialogDescription>
            If this product violates our community guidelines, is fraudulent, or inappropriate, please let us know.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid w-full gap-2">
            <Label htmlFor="reason">Reason for reporting</Label>
            <Textarea 
              id="reason" 
              placeholder="Provide additional details..." 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleReport} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Submit Report</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
