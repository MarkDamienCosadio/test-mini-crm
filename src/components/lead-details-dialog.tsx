'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from './ui/textarea';
import { Lead, Note, Appointment, LeadStatus } from '@prisma/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { addNoteToLead, updateLeadStatus, cancelAppointments } from '@/app/actions';
import { toast } from "sonner";

type LeadWithDetails = Lead & {
  notes: Note[];
  appointments: Appointment[];
};

interface LeadDetailsDialogProps {
  lead: LeadWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onScheduleClick: (lead: LeadWithDetails) => void;
  onCancelSuccess: () => void;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

export function LeadDetailsDialog({
  lead,
  isOpen,
  onClose,
  onScheduleClick,
  onCancelSuccess,
}: LeadDetailsDialogProps) {  
  const [localLead, setLocalLead] = useState<LeadWithDetails>(lead);
  const [noteContent, setNoteContent] = useState('');
  const [showCancelWarning, setShowCancelWarning] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    setLocalLead(lead);
  }, [lead]);
   
  const handleStatusChange = (status: LeadStatus) => {
    startTransition(() => {
      setLocalLead(prev => ({...prev, status: status}));
      updateLeadStatus(localLead.id, status).then(() => {
        toast.success("Status updated.");
        router.refresh();
      });
    });
  };
  
  const handleAddNote = () => {
    if (!noteContent.trim()) return;
    startTransition(() => {
        addNoteToLead(localLead.id, noteContent).then((newNote) => {
            setLocalLead(prevLead => ({
                ...prevLead,
                notes: [...prevLead.notes, newNote]
            }));
            setNoteContent('');
            toast.success("Note added successfully.");
            router.refresh(); 
        });
    });
  };

  const handleCancelAppointments = () => {
    const originalAppointments = localLead.appointments;
    setLocalLead(prev => ({...prev, appointments: []}));
    setShowCancelWarning(false);

    startTransition(async () => {
      const result = await cancelAppointments(localLead.id);
      if (result.success) {
        toast.success("Appointment Canceled", { description: "The appointment has been successfully canceled." });
        onCancelSuccess();
      } else {
        setLocalLead(prev => ({...prev, appointments: originalAppointments}));
        toast.error("Failed to cancel appointment.");
      }
      router.refresh();
    });
  };

const handleScheduleClick = () => {
  onScheduleClick(localLead);
};

  const formatEnumText = (text: string = ''): string => {
    return text.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-semibold">{localLead.firstName} {localLead.lastName}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">{localLead.email} | {localLead.phone}</p>
              </div>
            </div>
          </DialogHeader>
          <strong>Status:</strong>
          <Select defaultValue={localLead.status} onValueChange={handleStatusChange} disabled={isPending}>
            <SelectTrigger className="w-[180px] mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.values(LeadStatus).map(status => (
                <SelectItem key={status} value={status}>{formatEnumText(status)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-4 py-6">
            <DetailItem label="Interest" value={formatEnumText(localLead.propertyInterest)} />
            <DetailItem label="Source" value={formatEnumText(localLead.source)} />
            <DetailItem label="Transaction" value={formatEnumText(localLead.transaction)} />
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Appointments</h3>
              <Button variant="outline" size="sm" onClick={handleScheduleClick}>
                Schedule New
              </Button>
            </div>
            <div className="space-y-2 mb-2">
              {localLead.appointments.length > 0 ? (
                <div className="flex items-center justify-between text-sm p-3 bg-muted/50 rounded-md border">
                  <div>
                    <p className="font-medium">{localLead.appointments[0].title}</p>
                    <p className="text-muted-foreground">
                      {new Date(localLead.appointments[0].startTime).toLocaleString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => setShowCancelWarning(true)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No appointments scheduled.</p>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Notes</h3>
            <div className="space-y-2">
              <Textarea
                placeholder="Add a new note..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
              />
              <Button onClick={handleAddNote} disabled={isPending || !noteContent.trim()}>
                {isPending ? 'Adding...' : 'Add Note'}
              </Button>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
              {localLead.notes.map(note => (
                <div key={note.id} className="text-sm bg-muted p-3 rounded-md border">
                  <p className="whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={showCancelWarning} onOpenChange={setShowCancelWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Appointment Already Exists</AlertDialogTitle>
            <AlertDialogDescription>
              This lead already has an appointment. Canceling it will permanently remove it. Do you wish to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelAppointments}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel and Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}