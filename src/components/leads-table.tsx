'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lead, Note, LeadStatus, Appointment } from '@prisma/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LeadDetailsDialog } from './lead-details-dialog';
import { ScheduleAppointmentDialog } from './schedule-appointment-dialog';
import { SuccessDialog } from './success-dialog';

type LeadWithDetails = Lead & {
  notes: Note[];
  appointments: Appointment[];
};

export function LeadsTable({ leads: initialLeads }: { leads: LeadWithDetails[] }) {
  const [leads, setLeads] = useState<LeadWithDetails[]>(initialLeads);
  const [selectedLead, setSelectedLead] = useState<LeadWithDetails | null>(null);
  const [schedulingLead, setSchedulingLead] = useState<LeadWithDetails | null>(null);
  const [showScheduleSuccess, setShowScheduleSuccess] = useState(false);
  const [scheduledLeadId, setScheduledLeadId] = useState<string | null>(null);
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

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

  const handleScheduleClick = (leadToSchedule: LeadWithDetails) => {
    setSelectedLead(null);
    setSchedulingLead(leadToSchedule);
    setScheduledLeadId(leadToSchedule.id);
  };

  const handleScheduleSuccess = (newAppointment: Appointment) => {
    router.refresh();
    // Update local state immediately
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === schedulingLead?.id 
          ? {...lead, appointments: [...lead.appointments, newAppointment]} 
          : lead
      )
    );
    setShowScheduleSuccess(true);
    setSchedulingLead(null);
  };

  const handleSuccessClose = () => {
    setShowScheduleSuccess(false);
    // Reopen the lead details with updated data
    if (scheduledLeadId) {
      const updatedLead = leads.find(lead => lead.id === scheduledLeadId);
      if (updatedLead) {
        setSelectedLead(updatedLead);
      }
    }
    setScheduledLeadId(null);
  };

  const handleCancelSuccess = () => {
    router.refresh();
    // Update local state immediately
    if (selectedLead) {
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === selectedLead.id 
            ? {...lead, appointments: []} 
            : lead
        )
      );
      const updatedLead = leads.find(lead => lead.id === selectedLead.id);
      if (updatedLead) setSelectedLead(updatedLead);
    }
  };

  const handleStatusChange = (leadId: string, newStatus: LeadStatus) => {
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === leadId 
          ? {...lead, status: newStatus} 
          : lead
      )
    );
    if (selectedLead?.id === leadId) {
      setSelectedLead({...selectedLead, status: newStatus});
    }
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

      {selectedLead && (
        <LeadDetailsDialog
          key={selectedLead.id}
          lead={selectedLead}
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          onScheduleClick={handleScheduleClick}
          onCancelSuccess={handleCancelSuccess}
          onStatusChange={handleStatusChange}
        />
      )}

      {schedulingLead && (
        <ScheduleAppointmentDialog
          leadId={schedulingLead.id}
          isOpen={!!schedulingLead}
          onClose={() => setSchedulingLead(null)}
          onSuccess={handleScheduleSuccess}
        />
      )}

      {showScheduleSuccess && (
        <SuccessDialog
          isOpen={showScheduleSuccess}
          onClose={handleSuccessClose}
          title="Appointment Set!"
          description="The new appointment has been successfully scheduled."
        />
      )}
    </>
  );
}