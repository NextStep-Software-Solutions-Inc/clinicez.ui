'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import PatientCreationStepper from './PatientCreationStepper';
import { useRouter } from 'next/navigation';

interface PatientCreationModalProps {
  clinicId: number;
  createdBy: number;
  trigger?: React.ReactNode;
}

export default function PatientCreationModal({
  clinicId,
  createdBy,
  trigger,
}: PatientCreationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleComplete = () => {
    setIsOpen(false);
    router.refresh();
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <PatientCreationStepper
          clinicId={clinicId}
          createdBy={createdBy}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
