"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type MasterDetailBackProps = {
  label: string;
  onBack: () => void;
};

export function MasterDetailBack({ label, onBack }: MasterDetailBackProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="mb-4 -ml-2 lg:hidden"
      onClick={onBack}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
