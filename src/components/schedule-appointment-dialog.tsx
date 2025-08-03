'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { createAppointment, AppointmentFormState } from '@/app/actions';
import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';

const initialState: AppointmentFormState = { message: null, errors: {} };

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" aria-disabled={pending}>{pending ? 'Scheduling...' : 'Schedule'}</Button>;
}

export function ScheduleAppointmentDialog({ leadId, isOpen, onClose, onSuccess }: { leadId: string; isOpen: boolean; onClose: () => void; onSuccess: () => void; }) {
  const [state, dispatch] = useActionState(createAppointment, initialState);
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  useEffect(() => {
    if (state.message?.includes('successfully')) {
      onSuccess();
      onClose();
    }
  }, [state, onSuccess, onClose]);

  const handleSubmit = (formData: FormData) => {
    const time = formData.get('time') as string;
    if (date && time) {
      const [hours, minutes] = time.split(':');
      const combinedDateTime = new Date(date);
      combinedDateTime.setHours(parseInt(hours), parseInt(minutes));
      formData.set('startTime', combinedDateTime.toISOString());
    }
    dispatch(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Schedule Appointment</DialogTitle></DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="leadId" value={leadId} />
          <div className="flex flex-col sm:flex-row gap-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
            <div className="space-y-4 flex-grow">
              <div className="space-y-1">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" defaultValue="Property Viewing" />
                {state.errors?.title && <p className="text-sm text-red-500">{state.errors.title[0]}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="time">Time</Label>
                <Input id="time" name="time" type="time" defaultValue="10:00" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input id="duration" name="duration" type="number" defaultValue="60" />
                {state.errors?.duration && <p className="text-sm text-red-500">{state.errors.duration[0]}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}