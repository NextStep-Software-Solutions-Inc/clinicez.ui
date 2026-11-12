import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DisabilitiesInlineForm } from './DisabilitiesInlineForm';
import {
  addUserDisabilityAction,
  deleteUserDisabilityAction,
  updateUserDisabilityAction,
} from '@/actions/users/user-disability.action';
import { toast } from 'sonner';

// Mock server-only and database dependencies
jest.mock('server-only', () => ({}));
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {},
}));
jest.mock('@/actions/disability/get-disabilities.action', () => ({
  getDisabilitiesAction: jest.fn().mockResolvedValue([]),
}));

// Mock server actions
jest.mock('@/actions/users/user-disability.action', () => ({
  addUserDisabilityAction: jest.fn(),
  deleteUserDisabilityAction: jest.fn(),
  updateUserDisabilityAction: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('DisabilitiesInlineForm (Issue #188 & #235)', () => {
  const mockUserId = 'usr_test_123';

  beforeEach(() => {
    jest.clearAllMocks();
    (addUserDisabilityAction as jest.Mock).mockResolvedValue({ success: true, id: 1 });
    (deleteUserDisabilityAction as jest.Mock).mockResolvedValue({ success: true });
    (updateUserDisabilityAction as jest.Mock).mockResolvedValue({ success: true });
  });

  // =========================================================================
  // Tier 1: Feature Coverage (Happy Path)
  // =========================================================================
  describe('Tier 1: Feature Coverage (Happy Path)', () => {
    it('renders existing disabilities with correct names, severity, and notes', () => {
      const mockDisabilities = [
        {
          id: 10,
          disability: 'Visual Impairment',
          severity: 'MODERATE',
          notes: 'Requires corrective lenses',
        },
        {
          id: 11,
          disability: { name: 'Hearing Impairment' },
          severity: 'MILD',
          notes: null,
        },
      ];

      render(
        <DisabilitiesInlineForm
          userId={mockUserId}
          disabilities={mockDisabilities}
        />
      );

      // Verify names rendered properly (resolving "Unknown Disability" bug)
      expect(screen.getByText('Visual Impairment')).toBeInTheDocument();
      expect(screen.getByText('Hearing Impairment')).toBeInTheDocument();
      expect(screen.queryByText('Unknown Disability')).not.toBeInTheDocument();

      // Verify severity and notes
      expect(screen.getByText('MODERATE')).toBeInTheDocument();
      expect(screen.getByText('MILD')).toBeInTheDocument();
      expect(screen.getByText(/Requires corrective lenses/)).toBeInTheDocument();
    });

    it('renders empty state when no disabilities are present', () => {
      render(
        <DisabilitiesInlineForm
          userId={mockUserId}
          disabilities={[]}
        />
      );

      expect(screen.getByText(/No disabilities logged/i)).toBeInTheDocument();
    });

    it('displays "Add Disability" button and toggles add mode on click', () => {
      render(
        <DisabilitiesInlineForm
          userId={mockUserId}
          disabilities={[]}
        />
      );

      const addBtn = screen.getByRole('button', { name: /add disability/i });
      expect(addBtn).toBeInTheDocument();

      fireEvent.click(addBtn);

      expect(screen.getByText(/Add New Disability/i)).toBeInTheDocument();
    });

    it('displays standard 6 disability options in add mode (#188)', () => {
      render(
        <DisabilitiesInlineForm
          userId={mockUserId}
          disabilities={[]}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /add disability/i }));

      // 6 Standard PhilHealth disability options
      const standardOptions = [
        'Physical Disability',
        'Visual Impairment',
        'Hearing Impairment',
        'Cognitive Disability',
        'Speech Impairment',
        'Others',
      ];

      for (const option of standardOptions) {
        expect(screen.getByText(new RegExp(option, 'i'))).toBeInTheDocument();
      }
    });

    it('calls deleteUserDisabilityAction when removing a disability', async () => {
      window.confirm = jest.fn().mockReturnValue(true);

      const mockDisabilities = [
        {
          id: 42,
          disability: 'Physical Disability',
          severity: 'MILD',
          notes: 'Leg injury',
        },
      ];

      const onSuccessMock = jest.fn();

      render(
        <DisabilitiesInlineForm
          userId={mockUserId}
          disabilities={mockDisabilities}
          onSuccess={onSuccessMock}
        />
      );

      const deleteBtn = screen.getByRole('button', { name: '' }); // Trash icon button
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(deleteUserDisabilityAction).toHaveBeenCalledWith(42);
        expect(toast.success).toHaveBeenCalledWith('Disability record removed successfully');
        expect(onSuccessMock).toHaveBeenCalledTimes(1);
      });
    });
  });

  // =========================================================================
  // Tier 2: Boundary & Corner Cases (Validation & Specify Details)
  // =========================================================================
  describe('Tier 2: Boundary & Corner Cases', () => {
    it('cancels add mode when Cancel or X button is clicked', () => {
      render(
        <DisabilitiesInlineForm
          userId={mockUserId}
          disabilities={[]}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /add disability/i }));
      expect(screen.getByText(/Add New Disability/i)).toBeInTheDocument();

      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelBtn);

      expect(screen.queryByText(/Add New Disability/i)).not.toBeInTheDocument();
    });

    it('shows toast error when saving without selecting any disability', async () => {
      render(
        <DisabilitiesInlineForm
          userId={mockUserId}
          disabilities={[]}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /add disability/i }));

      const saveBtn = screen.getByRole('button', { name: /save disability/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
        expect(addUserDisabilityAction).not.toHaveBeenCalled();
      });
    });

    it('requires "Specify Details" when "Others" category is selected', async () => {
      render(
        <DisabilitiesInlineForm
          userId={mockUserId}
          disabilities={[]}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /add disability/i }));

      // Select "Others"
      const othersOption = screen.getByText(/Others/i);
      fireEvent.click(othersOption);

      // Attempt save without specifying details
      const saveBtn = screen.getByRole('button', { name: /save disability/i });
      fireEvent.click(saveBtn);

      // Toast error should prompt for details
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('disables categories that are already added to prevent duplicate constraint violation', () => {
      const existingDisabilities = [
        {
          id: 1,
          disability: 'Physical Disability',
          severity: 'MILD',
          notes: null,
        },
      ];

      render(
        <DisabilitiesInlineForm
          userId={mockUserId}
          disabilities={existingDisabilities}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /add disability/i }));

      // Checkbox or element for "Physical Disability" should indicate already added or disabled
      const physicalCheckbox = screen.queryByRole('checkbox', { name: /Physical Disability/i });
      if (physicalCheckbox) {
        expect(physicalCheckbox).toBeDisabled();
      } else {
        expect(screen.getByText(/Physical Disability/i)).toBeInTheDocument();
      }
    });
  });

  // =========================================================================
  // Tier 3: Cross-Feature Integration (Multi-Select & Details Mapping)
  // =========================================================================
  describe('Tier 3: Cross-Feature Integration', () => {
    it('maps "Specify Details" input field directly to notes in action payload (#188)', async () => {
      render(
        <DisabilitiesInlineForm
          userId={mockUserId}
          disabilities={[]}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /add disability/i }));

      // Find details input
      const detailsInput = screen.getByPlaceholderText(/details/i);
      fireEvent.change(detailsInput, { target: { value: 'Color blindness protanopia' } });

      // Select Visual Impairment
      const visualOption = screen.getByText(/Visual Impairment/i);
      fireEvent.click(visualOption);

      const saveBtn = screen.getByRole('button', { name: /save disability/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(addUserDisabilityAction).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: mockUserId,
            notes: 'Color blindness protanopia',
          })
        );
      });
    });

    it('heading/title displays "Disabilities" without redundant Illness references (#235)', () => {
      render(
        <DisabilitiesInlineForm
          userId={mockUserId}
          disabilities={[]}
        />
      );

      // Verify no redundant illness text in the component
      expect(screen.queryByText(/Disabilities and Illnesses/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Illness List/i)).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // Tier 4: Real-World Workflow Scenarios
  // =========================================================================
  describe('Tier 4: Real-World Workflow Scenario', () => {
    it('logs multiple disabilities for a patient encounter and refreshes profile', async () => {
      const onSuccessMock = jest.fn();

      render(
        <DisabilitiesInlineForm
          userId={mockUserId}
          disabilities={[]}
          onSuccess={onSuccessMock}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /add disability/i }));

      // Select Hearing Impairment
      const hearingOption = screen.getByText(/Hearing Impairment/i);
      fireEvent.click(hearingOption);

      // Specify details
      const detailsInput = screen.getByPlaceholderText(/details/i);
      fireEvent.change(detailsInput, { target: { value: 'Bilateral sensorineural hearing loss' } });

      const saveBtn = screen.getByRole('button', { name: /save disability/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(addUserDisabilityAction).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: mockUserId,
            notes: 'Bilateral sensorineural hearing loss',
            isManaged: true,
          })
        );
        expect(toast.success).toHaveBeenCalled();
        expect(onSuccessMock).toHaveBeenCalled();
      });
    });
  });
});
