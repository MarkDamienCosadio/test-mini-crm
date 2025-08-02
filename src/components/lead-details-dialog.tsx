// components/lead-details-dialog.tsx
'use client';

import { Lead, LeadStatus, Note } from '@prisma/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { addNoteToLead, updateLeadStatus } from '@/app/actions';
import { useState, useTransition } from 'react';

// We need to fetch notes separately
type LeadWithNotes = Lead & { notes: Note[] };

export function LeadDetailsDialog({ lead, isOpen, onClose }: { lead: LeadWithNotes, isOpen: boolean, onClose: () => void }) {
  const [noteContent, setNoteContent] = useState('');
  let [isPending, startTransition] = useTransition();

  const handleStatusChange = (status: LeadStatus) => {
    startTransition(async () => {
      await updateLeadStatus(lead.id, status);
    });
  };

  const handleAddNote = () => {
    startTransition(async () => {
        await addNoteToLead(lead.id, noteContent);
        setNoteContent(''); // Clear input on success
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{lead.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">{lead.email} | {lead.phone}</p>
        </DialogHeader>
        <div className="space-y-4">
            {/* Status Updater */}
            <div>
                <h3 className="font-semibold mb-2">Status</h3>
                <Select defaultValue={lead.status} onValueChange={handleStatusChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Change status..." />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.values(LeadStatus).map(status => (
                            <SelectItem key={status} value={status}>{status.replace('_', ' ')}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Notes Section */}
            <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {lead.notes.map(note => (
                        <div key={note.id} className="text-sm bg-muted p-2 rounded-md">
                            <p>{note.content}</p>
                            <p className="text-xs text-muted-foreground">{new Date(note.createdAt).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex gap-2">
                    <Input
                        placeholder="Add a new note..."
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                    />
                    <Button onClick={handleAddNote} disabled={isPending || !noteContent}>
                        {isPending ? 'Adding...' : 'Add'}
                    </Button>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}