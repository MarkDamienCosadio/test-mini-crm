'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { LeadStatus, PropertyInterest, LeadSource, TransactionType } from '@prisma/client';

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

// Add the optional `note` field to the schema
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

  // Separate the note from the rest of the lead data
  const { note, ...leadData } = validatedFields.data;

  try {
    // Use a transaction to create the lead and its first note together
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
    return { 
      success: false, 
      message: 'Note content cannot be empty.' 
    };
  }

  try {
    await prisma.note.create({
      data: {
        leadId,
        content,
      },
    });
    revalidatePath('/'); 
    return { success: true };
  } catch (error) {
    console.error('Failed to add note:', error);
    return { 
      success: false, 
      message: 'Failed to add note.' 
    };
  }
}