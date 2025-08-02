import { Lead, Note, Appointment } from '@prisma/client';

export type LeadWithDetails = Lead & {
  notes: Note[];
  appointments: Appointment[];
};