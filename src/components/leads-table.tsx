'use client'; 

import { Lead } from '@prisma/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | "success" => {
    switch (status) {
      case 'NEW': return 'default';
      case 'CONTACTED': return 'secondary';
      case 'CLOSED': return 'success';
      case 'DROPPED': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Property Interest</TableHead>
            <TableHead className="hidden lg:table-cell">Source</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id} onClick={() => setSelectedLead(lead)} className="cursor-pointer">
              <TableCell>
                <div className="font-medium">{lead.name}</div>
                <div className="text-sm text-muted-foreground md:hidden">{lead.propertyInterest}</div>
              </TableCell>
              <TableCell className="hidden md:table-cell">{lead.propertyInterest}</TableCell>
              <TableCell className="hidden lg:table-cell">{lead.source}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(lead.status)}>{lead.status.replace('_', ' ')}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* We will add the LeadDetailsDialog component later */}
      {/* {selectedLead && (
        <LeadDetailsDialog
          lead={selectedLead}
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )} */}
    </>
  );
}