'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { LeadStatus, PropertyInterest, LeadSource, TransactionType, Appointment } from '@prisma/client';

type FormState = {
  message: string | null;
  errors?: Record<string, string[]>;
};

export type AppointmentFormState = {
  message: string | null;
  appointment?: Appointment;
  errors?: {
    title?: string[];
    startTime?: string[];
    duration?: string[];
    leadId?: string[];
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

const AppointmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  startTime: z.coerce.date({ message: "Invalid date format." }),
  duration: z.coerce.number().min(15, "Duration must be at least 15 minutes."),
  leadId: z.string(),
});

export async function addLead(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = LeadSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    propertyInterest: formData.get('propertyInterest'),
    source: formData.get('source'),
    transaction: formData.get('transaction'),
    note: formData.get('note'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { note, ...leadData } = validatedFields.data;

  try {
    await prisma.$transaction(async (tx) => {
      const newLead = await tx.lead.create({
        data: leadData,
      });

      if (note && note.trim().length > 0) {
        await tx.note.create({
          data: {
            content: note,
            leadId: newLead.id,
          },
        });
      }
    });

    revalidatePath('/');
    return { message: 'Lead added successfully.' };
  } catch (error) {
    console.error('Failed to create lead:', error);
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
    console.error('Failed to update lead status:', error);
    return { 
      success: false, 
      message: 'Failed to update status.' 
    };
  }
}

export async function addNoteToLead(leadId: string, content: string) {
  if (!content || content.trim().length === 0) {
    throw new Error('Note content cannot be empty.');
  }

  try {
    const note = await prisma.note.create({
      data: {
        leadId,
        content,
      },
    });
    revalidatePath('/');
    return note; // Return the created note directly
  } catch (error) {
    console.error('Failed to add note:', error);
    throw new Error('Failed to add note.');
  }
}

export async function createAppointment(
  prevState: AppointmentFormState, 
  formData: FormData
): Promise<AppointmentFormState> {
  const validatedFields = AppointmentSchema.safeParse({
    title: formData.get('title'),
    startTime: formData.get('startTime'),
    duration: formData.get('duration'),
    leadId: formData.get('leadId'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { title, startTime, duration, leadId } = validatedFields.data;
  const endTime = new Date(new Date(startTime).getTime() + duration * 60000);

  try {
    const appointment = await prisma.appointment.create({
      data: {
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        leadId,
      },
    });

    revalidatePath('/');
    return { 
      message: 'Appointment created successfully.',
      appointment // Include the created appointment
    };
  } catch (error) {
    console.error(error);
    return { 
      message: 'Database Error: Failed to create appointment.',
      errors: {} // Include empty errors object to match type
    };
  }
}