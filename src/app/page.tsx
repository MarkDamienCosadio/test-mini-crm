// src/app/page.tsx
import prisma from '@/lib/prisma';
import { LeadsTable } from '@/components/leads-table';
import { AddLeadDialog } from '@/components/add-lead-dialog';
import { SearchFilters } from '@/components/search-filters';
import { LeadStatus } from '@prisma/client';

export default async function Home({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    status?: string;
  };
}) {
  const query = searchParams?.query || '';
  const status = searchParams?.status || '';

  const leads = await prisma.lead.findMany({
    where: {
      AND: [
        query ? {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        } : {},
        status ? {
          status: status as LeadStatus,
        } : {},
      ],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      notes: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      appointments: {
        orderBy: {
          startTime: 'asc',
        },
      },
    },
  });

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Real Estate CRM</h1>
        <AddLeadDialog />
      </div>
      
      {/* Add the new search/filter component here */}
      <SearchFilters />

      <div className="mt-4 rounded-lg border">
        <LeadsTable leads={leads} />
      </div>
    </main>
  );
}