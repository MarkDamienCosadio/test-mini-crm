'use client';

import { useState, useMemo } from 'react';
import { Lead, Note, LeadStatus } from '@prisma/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LeadDetailsDialog } from './lead-details-dialog';
import { Eye } from 'lucide-react';

type LeadWithNotes = Lead & {
  notes: Note[];
};

export function LeadsTable({ leads }: { leads: LeadWithNotes[] }) {
  const [selectedLead, setSelectedLead] = useState<LeadWithNotes | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:max-w-sm bg-background/90 backdrop-blur-sm"
        />
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Label htmlFor="status-filter" className="text-sm font-medium text-muted-foreground">
            Status
          </Label>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger id="status-filter" className="w-[180px] bg-background/90 backdrop-blur-sm">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-background/90 backdrop-blur-sm border-border/50">
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
      
      <div className="rounded-xl border border-border/50 bg-background/90 backdrop-blur-sm overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-medium">Name</TableHead>
              <TableHead className="hidden lg:table-cell font-medium">Email</TableHead>
              <TableHead className="hidden xl:table-cell font-medium">Phone</TableHead>
              <TableHead className="hidden md:table-cell font-medium">Latest Note</TableHead>
              <TableHead className="hidden md:table-cell font-medium">Status</TableHead>
              <TableHead className="text-right font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length > 0 ? (
              filteredLeads.map((lead) => (
                <TableRow 
                  key={lead.id} 
                  className="group hover:bg-blue-50/80 dark:hover:bg-blue-900/20 transition-colors duration-150"
                >
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{`${lead.firstName} ${lead.lastName}`}</span>
                      <span className="text-xs text-muted-foreground lg:hidden">{lead.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {lead.email}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-muted-foreground">
                    {lead.phone ?? 'N/A'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-xs truncate text-muted-foreground">
                    {lead.notes[0]?.content ?? 'No notes yet'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={getStatusVariant(lead.status)} className="font-medium tracking-wide">
                      {formatEnumText(lead.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedLead(lead)}
                      className="opacity-70 group-hover:opacity-100 transition-opacity hover:bg-blue-100/50 dark:hover:bg-blue-900/30"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      <span className="sr-only md:not-sr-only">View</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No leads match your criteria
                </TableCell>
              </TableRow>
            )}
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
    </div>
  );
}