'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';
import { Lead, Note, LeadStatus } from '@prisma/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { addNoteToLead, updateLeadStatus } from '@/app/actions';

type LeadWithNotes = Lead & {
  notes: Note[];
};

interface LeadDetailsDialogProps {
  lead: LeadWithNotes;
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
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

   const [displayedNotes, setDisplayedNotes] = useState<Note[]>(lead.notes);

    useEffect(() => {
    setDisplayedNotes(lead.notes);
  }, [lead.notes]);

  const handleStatusChange = (status: LeadStatus) => {
    startTransition(() => {
      updateLeadStatus(lead.id, status).then(() => router.refresh());
    });
  };

  const handleAddNote = () => {
    if (!noteContent.trim()) return;
        const tempId = `temp-${Date.now()}`;
      const optimisticNote: Note = {
      id: tempId,
      content: noteContent,
      leadId: lead.id,
      createdAt: new Date(),
    };

    setDisplayedNotes(prevNotes => [optimisticNote, ...prevNotes]);
    setNoteContent('');

    startTransition(async () => {
      try {
        const newNote = await addNoteToLead(lead.id, optimisticNote.content);
        setDisplayedNotes(prevNotes => 
          prevNotes.map(note => note.id === tempId ? newNote : note)
        );
      } catch (error) {
        console.error("Failed to save note:", error);
        setDisplayedNotes(prevNotes => prevNotes.filter(note => note.id !== tempId));
      }
    });
  };

  const formatEnumText = (text: string = ''): string => {
    return text.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  return (
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
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {/* 4. Render the notes from the local state */}
            {displayedNotes.map(note => (
              <div key={note.id} className="text-sm bg-muted p-3 rounded-md border">
                <p className="whitespace-pre-wrap">{note.content}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(note.createdAt).toLocaleString()}
                  {/* 5. Add a visual indicator for notes being saved */}
                  {note.id.startsWith('temp-') && ' (Saving...)'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}