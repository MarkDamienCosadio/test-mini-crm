'use client';

import { useState, useMemo } from 'react';
import { Lead, Note, LeadStatus, Appointment } from '@prisma/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LeadDetailsDialog } from './lead-details-dialog';

type LeadWithDetails = Lead & {
  notes: Note[];
  appointments: Appointment[];
};

export function LeadsTable({ leads }: { leads: LeadWithDetails[] }) {
  // UPDATE: State management is now much simpler.
  // We only need to know which lead is selected.
  const [selectedLead, setSelectedLead] = useState<LeadWithDetails | null>(null);

  // Search and filter state remains the same.
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Client-side filtering logic remains the same.
  const filteredLeads = useMemo(() => {
    return leads
      .filter(lead => {
        if (statusFilter === 'ALL') return true;
        return lead.status === statusFilter;
      })
      .filter(lead => {
        if (!searchTerm) return true;
        const lowercasedTerm = searchTerm.toLowerCase();
        return (
          lead.firstName.toLowerCase().includes(lowercasedTerm) ||
          lead.lastName.toLowerCase().includes(lowercasedTerm) ||
          lead.email.toLowerCase().includes(lowercasedTerm)
        );
      });
  }, [leads, searchTerm, statusFilter]);

  const getStatusVariant = (status: LeadStatus): "default" | "secondary" | "destructive" | "outline" | "success" => {
    switch (status) {
      case 'NEW': return 'default';
      case 'CONTACTED': return 'secondary';
      case 'SCHEDULED_VISIT': return 'outline';
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
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter">Show</Label>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger id="status-filter" className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {Object.values(LeadStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {formatEnumText(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden lg:table-cell">Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length > 0 ? (
              filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div className="font-medium">{`${lead.firstName} ${lead.lastName}`}</div>
                    <div className="text-sm text-muted-foreground lg:hidden">{lead.email}</div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{lead.email}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(lead.status)}>{formatEnumText(lead.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelectedLead(lead)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  No leads found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* UPDATE: The only dialog rendered here is the main details dialog. */}
      {selectedLead && (
        <LeadDetailsDialog
          // Use the latest data from the `leads` prop to prevent showing stale data
          lead={leads.find(l => l.id === selectedLead.id) || selectedLead}
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </>
  );
}