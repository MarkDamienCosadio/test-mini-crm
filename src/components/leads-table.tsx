'use client';

import { Lead } from '@prisma/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success";

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const [, setSelectedLead] = useState<Lead | null>(null); // Removed unused selectedLead

  const getStatusVariant = (status: string): BadgeVariant => {
    switch (status) {
      case 'NEW': return 'default';
      case 'CONTACTED': return 'secondary';
      case 'CLOSED': return 'success';
      case 'DROPPED': return 'destructive';
      default: return 'outline';
    }
  };

  const formatStatusText = (status: string): string => {
    return status.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead className="hidden md:table-cell">Property Interest</TableHead>
            <TableHead className="hidden lg:table-cell">Source</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow 
              key={lead.id} 
              onClick={() => setSelectedLead(lead)} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <TableCell>
                <div className="font-medium">{lead.name}</div>
                <div className="text-sm text-muted-foreground md:hidden">
                  {lead.propertyInterest}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {lead.propertyInterest}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {lead.source}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(lead.status)}>
                  {formatStatusText(lead.status)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}