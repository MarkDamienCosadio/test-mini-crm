// components/add-lead-dialog.tsx
'use client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addLead } from '@/app/actions';
import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useState } from 'react';

const initialState = { message: null, errors: {} };

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" aria-disabled={pending}>{pending ? 'Adding...' : 'Add Lead'}</Button>;
}

export function AddLeadDialog() {
  const [state, dispatch] = useFormState(addLead, initialState);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (state.message?.includes('successfully')) {
      setIsOpen(false); // Close dialog on success
    }
  }, [state]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Add New Lead</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
        </DialogHeader>
        <form action={dispatch}>
          <div className="grid gap-4 py-4">
            {/* Form Fields... */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" name="name" className="col-span-3" required />
            </div>
            {/* Add other fields: email, phone, propertyInterest, source */}
          </div>
          <SubmitButton />
          {state?.errors?.email && <p className="text-sm text-red-500 mt-2">{state.errors.email[0]}</p>}
          {/* Add other error messages */}
        </form>
      </DialogContent>
    </Dialog>
  );
}