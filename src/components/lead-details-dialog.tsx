'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Lead, Note, Appointment, LeadStatus } from '@prisma/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ScheduleAppointmentDialog } from './schedule-appointment-dialog';
import { toast } from 'sonner';
import { addNoteToLead, cancelAppointments, updateLeadStatus } from '@/app/actions';

type LeadWithDetails = Lead & {
  notes: Note[];
  appointments: Appointment[];
};

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

interface LeadDetailsDialogProps {
  lead: LeadWithDetails;
  isOpen: boolean;
  onClose: () => void;
}

export function LeadDetailsDialog({ lead, isOpen, onClose }: LeadDetailsDialogProps) {
  const router = useRouter();
  
  // UPDATE: We now have a separate transition for each asynchronous action.
  const [isStatusPending, startStatusTransition] = useTransition();
  const [isNotePending, startNoteTransition] = useTransition();
  const [isCancelPending, startCancelTransition] = useTransition();

  const [isScheduling, setIsScheduling] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  const handleScheduleSuccess = () => {
    setIsScheduling(false);
    toast.success("Appointment Set!", {
      description: "The appointment has been successfully scheduled."
    });
    router.refresh();
  };
  
  const handleStatusChange = (status: LeadStatus) => {
    // UPDATE: Use the dedicated transition for status changes.
    startStatusTransition(() => {
      updateLeadStatus(lead.id, status).then(() => {
        toast.success("Status updated.");
        router.refresh();
      });
    });
  };

  const handleAddNote = () => {
    if (!noteContent.trim()) return;
    // UPDATE: Use the dedicated transition for adding a note.
    startNoteTransition(() => {
        addNoteToLead(lead.id, noteContent).then(() => {
            setNoteContent('');
            toast.success("Note added successfully.");
            router.refresh();
        });
    });
  };
  
  const handleCancelAppointment = async () => {
    // UPDATE: Use the dedicated transition for cancellation.
    startCancelTransition(async () => {
      await cancelAppointments(lead.id); 
      toast.success("Appointment Canceled");
      router.refresh();
    });
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
                <DialogTitle className="text-2xl font-semibold">{lead.firstName} {lead.lastName}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">{lead.email} | {lead.phone}</p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="py-6 space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              {/* UPDATE: Use `isStatusPending` to disable the select dropdown during update. */}
              <Select defaultValue={lead.status} onValueChange={handleStatusChange} disabled={isStatusPending}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(LeadStatus).map(status => (
                    <SelectItem key={status} value={status}>{formatEnumText(status)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DetailItem label="Interest" value={formatEnumText(lead.propertyInterest)} />
              <DetailItem label="Source" value={formatEnumText(lead.source)} />
              <DetailItem label="Transaction" value={formatEnumText(lead.transaction)} />
            </div>
          </div>


          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Appointments</h3>
              <Button variant="outline" size="sm" onClick={() => setIsScheduling(true)}>
                Schedule New
              </Button>
            </div>
            <div className="space-y-2 mb-2">
              {lead.appointments.length > 0 ? (
                lead.appointments.map(appointment => (
                  <div key={appointment.id} className="flex items-center justify-between text-sm p-3 bg-muted/50 rounded-md border">
                    <div>
                      <p className="font-medium">{appointment.title}</p>
                      <p className="text-muted-foreground">
                        {new Date(appointment.startTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    {/* UPDATE: Use `isCancelPending` for the cancel button's state. */}
                    <Button variant="destructive" size="sm" onClick={handleCancelAppointment} disabled={isCancelPending}>
                      {isCancelPending ? 'Canceling...' : 'Cancel'}
                    </Button>
                  </div>
                ))
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
                disabled={isNotePending}
              />
              {/* UPDATE: Use `isNotePending` for the add note button's state. */}
              <Button onClick={handleAddNote} disabled={isNotePending || !noteContent.trim()}>
                {isNotePending ? 'Adding...' : 'Add Note'}
              </Button>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
              {lead.notes.map(note => (
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

      <ScheduleAppointmentDialog
        leadId={lead.id}
        isOpen={isScheduling}
        onClose={() => setIsScheduling(false)}
        onSuccess={handleScheduleSuccess}
      />
    </>
  );
}