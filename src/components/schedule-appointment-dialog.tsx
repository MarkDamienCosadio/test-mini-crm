'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { createAppointment, AppointmentFormState } from '@/app/actions';
import { useEffect, useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Appointment } from '@prisma/client';
import { CheckCircle2 } from 'lucide-react';
import { SuccessDialog } from './success-dialog';

const initialState: AppointmentFormState = { message: null, errors: {} };

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" aria-disabled={pending}>{pending ? 'Scheduling...' : 'Schedule'}</Button>;
}

interface ScheduleAppointmentDialogProps {
  leadId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (appointment: Appointment) => void;
}

export function ScheduleAppointmentDialog({ 
  leadId, 
  isOpen, 
  onClose, 
  onSuccess 
}: ScheduleAppointmentDialogProps) {
  const [state, formAction] = useActionState(createAppointment, initialState);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (formData: FormData) => {
    const time = formData.get('time') as string;
    if (date && time) {
      const [hours, minutes] = time.split(':');
      const combinedDateTime = new Date(date);
      combinedDateTime.setHours(parseInt(hours), parseInt(minutes));
      formData.set('startTime', combinedDateTime.toISOString());
    }
    formData.set('leadId', leadId);
    return formAction(formData);
  };

  useEffect(() => {
    if (state.appointment) {
      setShowSuccess(true);
      onClose(); // Close the scheduling dialog
      onSuccess?.(state.appointment);
    }
  }, [state, onClose, onSuccess]);

  return (
    <><Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              required />
            <div className="space-y-4 flex-grow">
              <div className="space-y-1">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue="Property Viewing"
                  required />
                {state.errors?.title && (
                  <p className="text-sm text-red-500">{state.errors.title[0]}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  name="time"
                  type="time"
                  defaultValue="10:00"
                  required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  defaultValue="60"
                  min="15"
                  step="15"
                  required />
                {state.errors?.duration && (
                  <p className="text-sm text-red-500">{state.errors.duration[0]}</p>
                )}
              </div>
            </div>
          </div>
          {state.message && (
            <p className={`text-sm ${state.message.includes('successfully')
                ? 'text-green-500'
                : 'text-red-500'}`}>
              {state.message}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog><SuccessDialog
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)} /></>
  );
}