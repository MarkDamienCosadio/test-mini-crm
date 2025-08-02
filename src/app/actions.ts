// src/app/actions.ts
'use server';

import prisma from '@/lib/prisma';
import { LeadStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// 1. Define the state type
export type FormState = {
  message: string | null;
  errors?: {
    name?: string[];
    email?: string[];
    propertyInterest?: string[];
    source?: string[];
  };
};

const LeadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().optional(),
  propertyInterest: z.string().min(3, "Property interest is required."),
  source: z.string().min(2, "Source is required."),
});

export async function addLead(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = LeadSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    propertyInterest: formData.get('propertyInterest'),
    source: formData.get('source'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.lead.create({
      data: validatedFields.data,
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