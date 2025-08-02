'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Lead, Note, LeadStatus, Appointment } from '@prisma/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { addNoteToLead, updateLeadStatus } from '@/app/actions';
import { ScheduleAppointmentDialog } from './schedule-appointment-dialog';
import { SuccessDialog } from './success-dialog';

type LeadWithDetails = Lead & { 
  notes: Note[]; 
  appointments: Appointment[] 
};

interface LeadDetailsDialogProps {
  lead: LeadWithDetails;
  isOpen: boolean;
  onClose: () => void;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

export function LeadDetailsDialog({ lead, isOpen, onClose }: LeadDetailsDialogProps) {
  const [noteContent, setNoteContent] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [localNotes, setLocalNotes] = useState<Note[]>(lead.notes);
  const router = useRouter();

  const [localAppointments, setLocalAppointments] = useState<Appointment[]>(lead.appointments);
  
  const handleStatusChange = (status: LeadStatus) => {
    startTransition(() => {
      updateLeadStatus(lead.id, status).then(() => router.refresh());
    });
  };

const handleScheduleSuccess = (newAppointment: Appointment) => {
  setLocalAppointments([newAppointment, ...localAppointments]);
  setIsScheduling(false);
  onClose();
  setShowSuccess(true);
};

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onClose();            
  };

  const handleAddNote = () => {
  if (!noteContent.trim()) return;
    
 const tempNote: Note = {
    id: `temp-${Date.now()}`,
    content: noteContent,
    leadId: lead.id,
    createdAt: new Date(),
  };

    // Optimistically update the UI
    setLocalNotes([tempNote, ...localNotes]);
    setNoteContent('');

    startTransition(async () => {
      try {
        const newNote = await addNoteToLead(lead.id, noteContent);
       
        setLocalNotes([newNote, ...localNotes.filter(note => note.id !== tempNote.id)]);
        router.refresh();
      } catch (error) {
      
        setLocalNotes(localNotes.filter(note => note.id !== tempNote.id));
        console.error('Failed to add note:', error);
      }
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
            <strong>Status:</strong>
              <Select defaultValue={lead.status} onValueChange={handleStatusChange} disabled={isPending}>
                <SelectTrigger className="w-[180px] mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(LeadStatus).map(status => (
                    <SelectItem key={status} value={status}>{formatEnumText(status)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          <div className="grid grid-cols-2 gap-4 py-6">
            <DetailItem label="Interest" value={formatEnumText(lead.propertyInterest)} />
            <DetailItem label="Source" value={formatEnumText(lead.source)} />
            <DetailItem label="Transaction" value={formatEnumText(lead.transaction)} />
          </div>
          
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Notes</h3>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
              {localNotes.slice(0, 3).map(note => (
                <div key={note.id} className="text-sm bg-muted p-3 rounded-md border">
                  <p className="whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(note.createdAt).toLocaleString()}
                    {note.id.startsWith('temp-') && ' (Saving...)'}
                  </p>
                </div>
              ))}
            
            </div>
            <div className="space-y-2">
              <Textarea
                placeholder="Add a new note..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
              />
              <Button onClick={handleAddNote} disabled={isPending || !noteContent}>
                {isPending ? 'Adding...' : 'Add Note'}
              </Button>
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
          {localAppointments.length > 0 ? (
            <div className="text-sm p-3 bg-muted/50 rounded-md border">
              <p className="font-medium">{localAppointments[0].title}</p>
              <p className="text-muted-foreground">
                {new Date(localAppointments[0].startTime).toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No appointments scheduled.</p>
          )}
        </div>
      </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isOpen} onOpenChange={onClose}>
        {/* ... rest of your JSX remains exactly the same ... */}
      </Dialog>
      
      <ScheduleAppointmentDialog
        leadId={lead.id}
        isOpen={isScheduling}
        onClose={() => setIsScheduling(false)}
      />
      <SuccessDialog
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Appointment Set!"
        description="Your appointment has been successfully scheduled."
      />
    </>
  );
}