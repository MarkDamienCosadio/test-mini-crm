'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { addLead, FormState } from '@/app/actions';
import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { PropertyInterest, LeadSource, TransactionType } from '@prisma/client';

const initialState: FormState = { message: null, errors: {} };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" aria-disabled={pending}>
      {pending ? 'Adding...' : 'Add Lead'}
    </Button>
  );
}

export function AddLeadDialog() {
  const [state, dispatch] = useActionState(addLead, initialState);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (state.message?.includes('successfully')) {
      setIsOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Add New Lead</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
        </DialogHeader>
        <form action={dispatch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" name="firstName" />
              {state.errors?.firstName && <p className="text-sm text-red-500">{state.errors.firstName[0]}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" name="lastName" />
              {state.errors?.lastName && <p className="text-sm text-red-500">{state.errors.lastName[0]}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" type="email" />
               {state.errors?.email && <p className="text-sm text-red-500">{state.errors.email[0]}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Property Interest</Label>
            <RadioGroup name="propertyInterest" className="flex flex-wrap gap-4">
              {Object.values(PropertyInterest).map((interest) => (
                <div key={interest} className="flex items-center space-x-2">
                  <RadioGroupItem value={interest} id={interest} />
                  <Label htmlFor={interest} className="capitalize font-normal">{interest.toLowerCase()}</Label>
                </div>
              ))}
            </RadioGroup>
            {state.errors?.propertyInterest && <p className="text-sm text-red-500">{state.errors.propertyInterest[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label>Lead Source</Label>
            <RadioGroup name="source" className="flex flex-wrap gap-4">
              {Object.values(LeadSource).map((source) => (
                <div key={source} className="flex items-center space-x-2">
                  <RadioGroupItem value={source} id={source} />
                  <Label htmlFor={source} className="capitalize font-normal">{source.replace('_', ' ').toLowerCase()}</Label>
                </div>
              ))}
            </RadioGroup>
            {state.errors?.source && <p className="text-sm text-red-500">{state.errors.source[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label>Transaction</Label>
            <RadioGroup name="transaction" className="flex flex-wrap gap-4">
              {Object.values(TransactionType).map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <RadioGroupItem value={type} id={type} />
                  <Label htmlFor={type} className="capitalize font-normal">{type.toLowerCase()}</Label>
                </div>
              ))}
            </RadioGroup>
             {state.errors?.transaction && <p className="text-sm text-red-500">{state.errors.transaction[0]}</p>}
          </div>

          {/* Notes Field */}
          <div className="space-y-2">
            <Label htmlFor="note">Initial Note (Optional)</Label>
            <Textarea id="note" name="note" placeholder="Add any initial notes about this lead..." />
          </div>

          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}