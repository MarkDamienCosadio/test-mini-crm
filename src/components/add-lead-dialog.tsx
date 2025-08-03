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
    <Button type="submit" aria-disabled={pending} className="w-full md:w-auto">
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </span>
      ) : 'Add Lead'}
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
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
          Add New Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border-0 shadow-xl">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <DialogTitle className="text-2xl font-semibold text-gray-800">Add New Lead</DialogTitle>
        </DialogHeader>
        <form action={dispatch} className="space-y-6 px-1 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-gray-700 font-medium">First Name</Label>
              <Input 
                id="firstName" 
                name="firstName" 
                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg shadow-sm"
              />
              {state.errors?.firstName && <p className="text-sm text-red-500 mt-1">{state.errors.firstName[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-gray-700 font-medium">Last Name</Label>
              <Input 
                id="lastName" 
                name="lastName" 
                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg shadow-sm"
              />
              {state.errors?.lastName && <p className="text-sm text-red-500 mt-1">{state.errors.lastName[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg shadow-sm"
              />
              {state.errors?.email && <p className="text-sm text-red-500 mt-1">{state.errors.email[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-700 font-medium">Phone Number</Label>
              <Input 
                id="phone" 
                name="phone" 
                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-gray-700 font-medium">Property Interest</Label>
            <RadioGroup name="propertyInterest" className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.values(PropertyInterest).map((interest) => (
                <div key={interest} className="flex items-center">
                  <RadioGroupItem 
                    value={interest} 
                    id={interest} 
                    className="h-5 w-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <Label 
                    htmlFor={interest} 
                    className="ml-3 block text-sm font-medium text-gray-700 capitalize"
                  >
                    {interest.toLowerCase()}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {state.errors?.propertyInterest && <p className="text-sm text-red-500 mt-1">{state.errors.propertyInterest[0]}</p>}
          </div>

          <div className="space-y-3">
            <Label className="text-gray-700 font-medium">Lead Source</Label>
            <RadioGroup name="source" className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.values(LeadSource).map((source) => (
                <div key={source} className="flex items-center">
                  <RadioGroupItem 
                    value={source} 
                    id={source} 
                    className="h-5 w-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <Label 
                    htmlFor={source} 
                    className="ml-3 block text-sm font-medium text-gray-700 capitalize"
                  >
                    {source.replace('_', ' ').toLowerCase()}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {state.errors?.source && <p className="text-sm text-red-500 mt-1">{state.errors.source[0]}</p>}
          </div>

          <div className="space-y-3">
            <Label className="text-gray-700 font-medium">Transaction</Label>
            <RadioGroup name="transaction" className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.values(TransactionType).map((type) => (
                <div key={type} className="flex items-center">
                  <RadioGroupItem 
                    value={type} 
                    id={type} 
                    className="h-5 w-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <Label 
                    htmlFor={type} 
                    className="ml-3 block text-sm font-medium text-gray-700 capitalize"
                  >
                    {type.toLowerCase()}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {state.errors?.transaction && <p className="text-sm text-red-500 mt-1">{state.errors.transaction[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note" className="text-gray-700 font-medium">Initial Note (Optional)</Label>
            <Textarea 
              id="note" 
              name="note" 
              rows={4} 
              className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg shadow-sm"
              placeholder="Add any initial notes about this lead..."
            />
          </div>

          <DialogFooter className="border-t border-gray-200 pt-4">
            <div className="flex flex-col-reverse md:flex-row gap-3 w-full">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                className="w-full md:w-auto"
              >
                Cancel
              </Button>
              <SubmitButton />
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}