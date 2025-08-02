'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { CheckCircle2 } from 'lucide-react';

interface SuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;  // Make optional if needed
  description?: string;  // Make optional if needed
}

export function SuccessDialog({ 
  isOpen, 
  onClose,
  title = "Appointment Set!",  // Default value
  description = ""  // Default empty
}: SuccessDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] text-center">
        <DialogHeader>
          <div className="mx-auto flex flex-col items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <DialogTitle>{title}</DialogTitle>
          </div>
        </DialogHeader>
        {description && (
          <p className="text-muted-foreground text-sm mt-2">{description}</p>
        )}
        <div className="flex justify-center mt-6">
          <Button onClick={onClose} className="px-8">
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}