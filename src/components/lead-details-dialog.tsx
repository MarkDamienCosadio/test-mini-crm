'use client';

import { Lead, Note, LeadStatus } from '@prisma/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { addNoteToLead, updateLeadStatus } from '@/app/actions';
import { useState, useTransition } from 'react';

// Define a more complete type for the lead, including all its notes
type LeadWithNotes = Lead & { notes: Note[] };

export function LeadDetailsDialog({ lead, isOpen, onClose }: { lead: LeadWithNotes, isOpen: boolean, onClose: () => void }) {
  const [noteContent, setNoteContent] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (status: LeadStatus) => {
    startTransition(() => {
      updateLeadStatus(lead.id, status);
    });
  };

  const handleAddNote = () => {
    if (!noteContent.trim()) return;
    startTransition(() => {
        addNoteToLead(lead.id, noteContent).then(() => {
            setNoteContent(''); // Clear input on success
        });
    });
  };

  // Helper function to format enums like 'SOCIAL_MEDIA' into 'Social Media'
  const formatEnumText = (text: string = ''): string => {
    return text.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead.firstName} {lead.lastName}</DialogTitle>
          <p className="text-sm text-muted-foreground">{lead.email} | {lead.phone}</p>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 py-4">
          {/* Lead Details */}
          <div><strong>Interest:</strong> {formatEnumText(lead.propertyInterest)}</div>
          <div><strong>Source:</strong> {formatEnumText(lead.source)}</div>
          <div><strong>Transaction:</strong> {formatEnumText(lead.transaction)}</div>
          <div>
            <strong>Status:</strong>
            <Select defaultValue={lead.status} onValueChange={handleStatusChange} disabled={isPending}>
                <SelectTrigger className="w-[180px] mt-1">
                    <SelectValue placeholder="Change status..." />
                </SelectTrigger>
                <SelectContent>
                    {Object.values(LeadStatus).map(status => (
                        <SelectItem key={status} value={status}>{formatEnumText(status)}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notes Section */}
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
                {lead.notes.map(note => (
                    <div key={note.id} className="text-sm bg-muted p-3 rounded-md border">
                        <p className="whitespace-pre-wrap">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">{new Date(note.createdAt).toLocaleString()}</p>
                    </div>
                ))}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}