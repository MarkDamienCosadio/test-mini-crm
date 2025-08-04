import prisma from '@/lib/prisma';
import { LeadsTable } from '@/components/leads-table';
import { AddLeadDialog } from '@/components/add-lead-dialog';

export default async function Home() {
  // This now fetches all leads without any filtering.
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      notes: { orderBy: { createdAt: 'desc' } },
    },
  });

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Real Estate CRM</h1>
        <AddLeadDialog />
      </div>
      
      {/* The SearchFilters component is removed from here */}
      <div className="mt-4 rounded-lg border">
        <LeadsTable leads={leads} />
      </div>
    </main>
  );
}