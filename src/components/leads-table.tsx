'use client';

import { useState } from 'react';
import { Lead, Note, LeadStatus } from '@prisma/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LeadDetailsDialog } from './lead-details-dialog';

// This is the correct type definition
type LeadWithNotes = Lead & {
  notes: Note[];
};

export function LeadsTable({ leads }: { leads: LeadWithNotes[] }) {
  // Use the correct type here for the selected lead state
  const [selectedLead, setSelectedLead] = useState<LeadWithNotes | null>(null);

  const getStatusVariant = (status: LeadStatus): "default" | "secondary" | "destructive" | "outline" | "success" => {
    switch (status) {
      case 'NEW': return 'default';
      case 'CONTACTED': return 'secondary';
      case 'CLOSED': return 'success';
      case 'DROPPED': return 'destructive';
      default: return 'outline';
    }
  };

  const formatEnumText = (text: string): string => {
    return text.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden lg:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Latest Note</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <div className="font-medium">{`${lead.firstName} ${lead.lastName}`}</div>
                  <div className="text-sm text-muted-foreground lg:hidden">{lead.email}</div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">{lead.email}</TableCell>
                {/* Use the notes array here to get the latest note */}
                <TableCell className="hidden md:table-cell max-w-xs truncate">
                  {lead.notes[0]?.content ?? 'No notes yet'}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(lead.status)}>{formatEnumText(lead.status)}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => setSelectedLead(lead)}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedLead && (
        <LeadDetailsDialog
          lead={selectedLead}
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </>
  );
}