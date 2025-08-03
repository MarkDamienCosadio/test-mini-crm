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
  const validatedFields = LeadSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { message: 'Validation failed.', errors: validatedFields.error.flatten().fieldErrors };
  }

  const { note, ...leadData } = validatedFields.data;

  try {
    await prisma.$transaction(async (tx) => {
      const newLead = await tx.lead.create({ data: leadData });
      if (note && note.trim().length > 0) {
        await tx.note.create({ data: { content: note, leadId: newLead.id } });
      }
    });
    revalidatePath('/');
    return { message: 'Lead added successfully.' };
  } catch (e) {
    return { message: 'Database Error: Failed to create lead.' };
  }
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  try {
    await prisma.lead.update({
      where: { id: leadId },
      data: { status },
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false, message: 'Failed to update status.' };
  }
}

export async function addNoteToLead(leadId: string, content: string) {
  if (!content || content.trim().length === 0) {
    throw new Error('Note content cannot be empty.');
  }
  try {
    const newNote = await prisma.note.create({
      data: {
        leadId,
        content,
      },
    });
    revalidatePath('/');
    return newNote; // Return the created note object
  } catch (error) {
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
};

const AppointmentSchema = z.object({
  title: z.string().min(3, "Title is required."),
  startTime: z.coerce.date({ message: "Invalid date." }),
  duration: z.coerce.number().min(15, "Duration must be at least 15 minutes."),
  leadId: z.string(),
});

export async function createAppointment(prevState: AppointmentFormState, formData: FormData): Promise<AppointmentFormState> {
  const validatedFields = AppointmentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validatedFields.success) {
    return { message: 'Validation failed.', errors: validatedFields.error.flatten().fieldErrors };
  }
  const { title, startTime, duration, leadId } = validatedFields.data;
  const endTime = new Date(startTime.getTime() + duration * 60000);
  try {
    await prisma.appointment.create({ data: { title, startTime, endTime, leadId } });
    revalidatePath('/');
    return { message: 'Appointment created successfully.' };
  } catch (error) {
    return { message: 'Database Error: Failed to create appointment.' };
  }
}

export async function cancelAppointments(leadId: string) {
  try {
    await prisma.appointment.deleteMany({ where: { leadId } });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false, message: 'Database error.' };
  }
}



