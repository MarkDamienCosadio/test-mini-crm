'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { LeadStatus, PropertyInterest, LeadSource, TransactionType, Appointment } from '@prisma/client';

export type FormState = {
  message: string | null;
  errors?: {
    firstName?: string[];
    lastName?: string[];
    email?: string[];
    propertyInterest?: string[];
    source?: string[];
    transaction?: string[];
  };
};

const LeadSchema = z.object({
  firstName: z.string().min(2, "First name is required."),
  lastName: z.string().min(2, "Last name is required."),
  email: z.string().email("Invalid email address."),
  phone: z.string().optional(),
  propertyInterest: z.nativeEnum(PropertyInterest),
  source: z.nativeEnum(LeadSource),
  transaction: z.nativeEnum(TransactionType),
  note: z.string().optional(),
});


export async function addLead(prevState: FormState, formData: FormData): Promise<FormState> {
  console.log('Attempting to add lead...');
  const validatedFields = LeadSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    console.error('Lead validation failed:', validatedFields.error.flatten().fieldErrors);
    return { message: 'Validation failed.', errors: validatedFields.error.flatten().fieldErrors };
  }

  const { note, ...leadData } = validatedFields.data;

  try {
    await prisma.$transaction(async (tx) => {
      const newLead = await tx.lead.create({ data: leadData });
      if (note && note.trim().length > 0) {
        await tx.note.create({ data: { content: note, leadId: newLead.id } });
      }
      console.log(`Successfully added new lead ${newLead.id}.`);
    });
    revalidatePath('/leads'); // Specific revalidation
    return { message: 'Lead added successfully.' };
  } catch (e) {
    console.error('Failed to create lead:', e);
    return { message: 'Database Error: Failed to create lead.' };
  }
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  console.log(`Attempting to update status for lead ${leadId} to ${status}...`);
  try {
    await prisma.lead.update({
      where: { id: leadId },
      data: { status },
    });
    console.log(`Successfully updated status for lead ${leadId}.`);
    revalidatePath('/leads'); // Specific revalidation
    return { success: true };
  } catch (error) {
    console.error(`Failed to update status for lead ${leadId}:`, error);
    return { success: false, message: 'Failed to update status.' };
  }
}

export async function addNoteToLead(leadId: string, content: string) {
  if (!content || content.trim().length === 0) {
    throw new Error('Note content cannot be empty.');
  }
  console.log(`Attempting to add note to lead ${leadId}...`);
  try {
    const newNote = await prisma.note.create({
      data: { leadId, content },
    });
    console.log(`Successfully added note ${newNote.id} to lead ${leadId}.`);
    revalidatePath('/leads'); // Specific revalidation
    return newNote; 
  } catch (error) {
    console.error(`Database Error: Failed to add note for lead ${leadId}:`, error);
    throw new Error('Database Error: Failed to add note.');
  }
}

export type AppointmentFormState = {
  message: string | null;
  errors?: {
    title?: string[];
    startTime?: string[];
    duration?: string[];
  };
  appointment?: Appointment; 
};

const AppointmentSchema = z.object({
  title: z.string().min(3, "Title is required."),
  startTime: z.coerce.date({ message: "Invalid date." }),
  duration: z.coerce.number().min(15, "Duration must be at least 15 minutes."),
  leadId: z.string(),
});

export async function createAppointment(prevState: AppointmentFormState, formData: FormData): Promise<AppointmentFormState> {
  console.log('Attempting to create appointment...');
  const validatedFields = AppointmentSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    console.error('Appointment validation failed:', validatedFields.error.flatten().fieldErrors);
    return { message: 'Validation failed.', errors: validatedFields.error.flatten().fieldErrors };
  }

  const { title, startTime, duration, leadId } = validatedFields.data;
  const endTime = new Date(startTime.getTime() + duration * 60000);

  try {
    const newAppointment = await prisma.appointment.create({ data: { title, startTime, endTime, leadId } });
    console.log(`Successfully created appointment ${newAppointment.id} for lead ${leadId}.`);
    revalidatePath('/leads'); // Specific revalidation
    return { message: 'Appointment created successfully.', appointment: newAppointment };
  } catch (error) {
    console.error(`Failed to create appointment for lead ${leadId}:`, error);
    return { message: 'Database Error: Failed to create appointment.' };
  }
}

export async function cancelAppointments(leadId: string) {
  console.log(`Attempting to cancel appointments for lead ${leadId}...`);
  try {
    await prisma.appointment.deleteMany({ where: { leadId } });
    console.log(`Successfully canceled appointments for lead ${leadId}.`);
    revalidatePath('/leads'); // Specific revalidation
    return { success: true };
  } catch (error) {
    console.error(`Failed to cancel appointments for lead ${leadId}:`, error);
    return { success: false, message: 'Database error.' };
  }
}