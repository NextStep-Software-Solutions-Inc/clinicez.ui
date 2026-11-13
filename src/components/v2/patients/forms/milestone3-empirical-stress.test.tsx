import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

import React, { act } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  parsePeCodes,
  formatPeCodes,
  togglePeFindingCode,
  isEssentiallyNormal,
  isOthersCode,
  PhysicalExamSystemField,
} from '@/components/health-records/physical-exam-system-field';
import { PhysicalExamInlineForm } from './PhysicalExamInlineForm';
import { DisabilitiesInlineForm, STANDARD_DISABILITIES } from './DisabilitiesInlineForm';

import {
  savePhysicalExaminationAction,
  deletePhysicalExaminationAction,
} from '@/actions/physical-exam.action';
import { getPhysicalExamLibrariesAction } from '@/actions/super-admin/physical-exam-library.action';
import {
  addUserDisabilityAction,
  updateUserDisabilityAction,
  deleteUserDisabilityAction,
} from '@/actions/users/user-disability.action';
import { toast } from 'sonner';

// Mocks
jest.mock('server-only', () => ({}));
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {},
}));
jest.mock('@/actions/physical-exam.action', () => ({
  savePhysicalExaminationAction: jest.fn(),
  deletePhysicalExaminationAction: jest.fn(),
}));
jest.mock('@/actions/super-admin/physical-exam-library.action', () => ({
  getPhysicalExamLibrariesAction: jest.fn(),
}));
jest.mock('@/actions/users/user-disability.action', () => ({
  addUserDisabilityAction: jest.fn(),
  updateUserDisabilityAction: jest.fn(),
  deleteUserDisabilityAction: jest.fn(),
}));
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const mockLibraries = [
  { id: '1', category: 'GENSURVEY', code: '1', description: 'Conscious, coherent, ambulatory' },
  { id: '2', category: 'GENSURVEY', code: '2', description: 'Lethargic' },
  { id: '3', category: 'HEENT', code: '11', description: 'Essentially normal' },
  { id: '4', category: 'HEENT', code: '1', description: 'Anicteric sclerae' },
  { id: '5', category: 'HEENT', code: '2', description: 'Pupils equal and reactive' },
  { id: '6', category: 'HEENT', code: '99', description: 'Others' },
  { id: '7', category: 'CHEST', code: '6', description: 'Essentially normal' },
  { id: '8', category: 'CHEST', code: '1', description: 'Clear breath sounds' },
  { id: '9', category: 'CHEST', code: '2', description: 'Rales / Crackles' },
  { id: '10', category: 'CHEST', code: '99', description: 'Others' },
  { id: '11', category: 'HEART', code: '5', description: 'Essentially normal' },
  { id: '12', category: 'HEART', code: '2', description: 'Essentially normal (legacy)' },
  { id: '13', category: 'HEART', code: '1', description: 'Normal rate, regular rhythm' },
  { id: '14', category: 'HEART', code: '3', description: 'Murmur' },
  { id: '15', category: 'HEART', code: '99', description: 'Others' },
  { id: '16', category: 'NEURO', code: '6', description: 'Essentially normal' },
  { id: '17', category: 'NEURO', code: '3', description: 'Essentially normal (legacy)' },
  { id: '18', category: 'NEURO', code: '1', description: 'Oriented x 3' },
  { id: '19', category: 'NEURO', code: '99', description: 'Others' },
  { id: '20', category: 'RECTAL', code: '1', description: 'Essentially normal' },
  { id: '21', category: 'RECTAL', code: '0', description: 'Not Applicable' },
  { id: '22', category: 'RECTAL', code: '99', description: 'Others' },
  { id: '23', category: 'SKIN', code: '1', description: 'Essentially normal' },
  { id: '24', category: 'SKIN', code: '2', description: 'Pallor' },
  { id: '25', category: 'SKIN', code: '99', description: 'Others' },
  { id: '26', category: 'ABDOMEN', code: '7', description: 'Essentially normal' },
  { id: '27', category: 'ABDOMEN', code: '1', description: 'Flat, soft' },
  { id: '28', category: 'ABDOMEN', code: '99', description: 'Others' },
  { id: '29', category: 'GU', code: '1', description: 'Essentially normal' },
  { id: '30', category: 'GU', code: '99', description: 'Others' },
];

describe('Milestone 3 Empirical Stress Testing Harness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getPhysicalExamLibrariesAction as jest.Mock).mockResolvedValue({
      data: mockLibraries,
    });
    (savePhysicalExaminationAction as jest.Mock).mockResolvedValue({
      data: { id: 101 },
    });
    (deletePhysicalExaminationAction as jest.Mock).mockResolvedValue({
      data: { success: true },
    });
    (addUserDisabilityAction as jest.Mock).mockResolvedValue({ success: true, id: 1 });
    (updateUserDisabilityAction as jest.Mock).mockResolvedValue({ success: true });
    (deleteUserDisabilityAction as jest.Mock).mockResolvedValue({ success: true });
  });

  // =========================================================================
  // Challenge 1: Physical Exam Multi-selection & Mutual Exclusivity
  // =========================================================================
  describe('Challenge 1: Physical Exam Delimiters & Mutual Exclusivity', () => {
    describe('1.1 Delimiter Stress-Testing (parsePeCodes & formatPeCodes)', () => {
      it('handles mixed delimiters ("1,2;3,4") and normalizes cleanly', () => {
        const input = '1,2;3,4';
        const parsed = parsePeCodes(input);
        expect(parsed).toEqual(['1', '2', '3', '4']);

        const formatted = formatPeCodes(input);
        expect(formatted).toBe('1,2,3,4');

        const semicolonFormatted = formatPeCodes(input, ';');
        expect(semicolonFormatted).toBe('1;2;3;4');
      });

      it('handles array input with mixed delimiters and whitespace', () => {
        const input = ['1, 2', '3; 4', '  5  ', ''];
        const parsed = parsePeCodes(input);
        expect(parsed).toEqual(['1', '2', '3', '4', '5']);
        expect(formatPeCodes(input)).toBe('1,2,3,4,5');
      });

      it('deduplicates repeating codes cleanly across delimiters', () => {
        const input = '1,1;2,2;1;3,3';
        const parsed = parsePeCodes(input);
        expect(parsed).toEqual(['1', '2', '3']);
        expect(formatPeCodes(input)).toBe('1,2,3');
      });

      it('handles empty, null, undefined, and garbage input gracefully', () => {
        expect(parsePeCodes(null)).toEqual([]);
        expect(parsePeCodes(undefined)).toEqual([]);
        expect(parsePeCodes('')).toEqual([]);
        expect(parsePeCodes('   ')).toEqual([]);
        expect(parsePeCodes(';,;;,')).toEqual([]);
        expect(formatPeCodes(null)).toBe('');
        expect(formatPeCodes(undefined)).toBe('');
        expect(formatPeCodes('')).toBe('');
      });
    });

    describe('1.2 Rapid Selection & Mutual Exclusivity (togglePeFindingCode)', () => {
      it('clears all abnormal codes when "Essentially normal" is selected', () => {
        // Start with HEENT abnormal codes: 1 (Anicteric sclerae), 2 (Pupils reactive), 99 (Others)
        let codes = ['1', '2', '99'];

        // Now select Essentially normal (11)
        codes = togglePeFindingCode('HEENT', codes, '11', 'Essentially normal');
        expect(codes).toEqual(['11']);
      });

      it('clears "Essentially normal" when any abnormal code is selected', () => {
        // Start with HEENT normal (11)
        let codes = ['11'];

        // Select abnormal code 1
        codes = togglePeFindingCode('HEENT', codes, '1', 'Anicteric sclerae');
        expect(codes).toEqual(['1']);

        // Select another abnormal code 2
        codes = togglePeFindingCode('HEENT', codes, '2', 'Pupils equal');
        expect(codes).toEqual(['1', '2']);
      });

      it('unchecks "Essentially normal" when toggled again leaving empty selection', () => {
        let codes = ['11'];
        // Uncheck 11
        codes = togglePeFindingCode('HEENT', codes, '11', 'Essentially normal');
        expect(codes).toEqual([]);
      });

      it('supports multi-code normal categories like HEART (5 and 2) and NEURO (6 and 3)', () => {
        // HEART: abnormal 1, 3
        let heartCodes = ['1', '3'];
        // Select legacy normal 2
        heartCodes = togglePeFindingCode('HEART', heartCodes, '2', 'Essentially normal');
        expect(heartCodes).toEqual(['2']);

        // Select abnormal 99 -> clears 2
        heartCodes = togglePeFindingCode('HEART', heartCodes, '99', 'Others');
        expect(heartCodes).toEqual(['99']);

        // Select current normal 5 -> clears 99
        heartCodes = togglePeFindingCode('HEART', heartCodes, '5', 'Essentially normal');
        expect(heartCodes).toEqual(['5']);

        // RECTAL: Not Applicable (0) and Essentially normal (1)
        let rectalCodes = ['99'];
        rectalCodes = togglePeFindingCode('RECTAL', rectalCodes, '0', 'Not Applicable');
        expect(rectalCodes).toEqual(['0']);
      });

      it('recognizes description-based essentially normal matching', () => {
        expect(isEssentiallyNormal('CUSTOM', '999', 'Essentially normal')).toBe(true);
        expect(isEssentiallyNormal('CUSTOM', '999', 'essentially  normal limits')).toBe(true);
        expect(isEssentiallyNormal('CUSTOM', '999', 'Abnormal mass')).toBe(false);
      });
    });

    describe('1.3 UI DOM Behavior & Remarks Autofocus on "Others" (99)', () => {
      it('autofocuses the remarks input when "Others" (99) is selected', async () => {
        const onRemarksChangeMock = jest.fn();
        const onChangeMock = jest.fn();

        const { rerender } = render(
          <PhysicalExamSystemField
            category="HEENT"
            label="Head, Eyes, Ears, Nose, Throat"
            value="1"
            onChange={onChangeMock}
            remarks=""
            onRemarksChange={onRemarksChangeMock}
            options={[
              { id: '1', code: '11', description: 'Essentially normal' },
              { id: '2', code: '1', description: 'Anicteric sclerae' },
              { id: '3', code: '99', description: 'Others' },
            ]}
          />
        );

        const remarksInput = screen.getByRole('textbox', { name: /remarks/i }) as HTMLInputElement;
        expect(remarksInput).toBeInTheDocument();
        expect(document.activeElement).not.toBe(remarksInput);

        // Simulate selecting 'Others' (99) -> triggers rerender with value '1,99'
        rerender(
          <PhysicalExamSystemField
            category="HEENT"
            label="Head, Eyes, Ears, Nose, Throat"
            value="1,99"
            onChange={onChangeMock}
            remarks=""
            onRemarksChange={onRemarksChangeMock}
            options={[
              { id: '1', code: '11', description: 'Essentially normal' },
              { id: '2', code: '1', description: 'Anicteric sclerae' },
              { id: '3', code: '99', description: 'Others' },
            ]}
          />
        );

        // Wait for autofocus timeout
        await waitFor(
          () => {
            expect(document.activeElement).toBe(remarksInput);
          },
          { timeout: 500 }
        );
      });

      it('does NOT steal focus on initial mount if "Others" was already in initialData', async () => {
        render(
          <PhysicalExamSystemField
            category="HEENT"
            label="Head, Eyes, Ears, Nose, Throat"
            value="99"
            onChange={jest.fn()}
            remarks="Existing remarks"
            onRemarksChange={jest.fn()}
            options={[
              { id: '1', code: '11', description: 'Essentially normal' },
              { id: '2', code: '99', description: 'Others' },
            ]}
          />
        );

        const remarksInput = screen.getByDisplayValue('Existing remarks');
        // On initial mount, prevHasOthersRef initializes to true, so no autofocus timer fires
        expect(document.activeElement).not.toBe(remarksInput);
      });

      it('removes a badge when clicking the X button', () => {
        const onChangeMock = jest.fn();

        render(
          <PhysicalExamSystemField
            category="HEENT"
            label="Head, Eyes, Ears, Nose, Throat"
            value="1,2"
            onChange={onChangeMock}
            remarks=""
            onRemarksChange={jest.fn()}
            options={[
              { id: '1', code: '1', description: 'Anicteric sclerae' },
              { id: '2', code: '2', description: 'Pupils equal' },
            ]}
          />
        );

        expect(screen.getByText('Anicteric sclerae')).toBeInTheDocument();
        expect(screen.getByText('Pupils equal')).toBeInTheDocument();

        // Find remove buttons for the badges
        const removeButtons = screen.getAllByRole('button', { name: '' }).filter((btn) =>
          btn.querySelector('svg.lucide-x')
        );
        expect(removeButtons.length).toBe(2);

        // Click X on first badge
        fireEvent.click(removeButtons[0]);
        expect(onChangeMock).toHaveBeenCalledWith('2');
      });
    });
  });

  // =========================================================================
  // Challenge 2: Disabilities Form Checkboxes & Details
  // =========================================================================
  describe('Challenge 2: Disabilities Form Checkboxes & Details', () => {
    describe('2.1 Multi-selection Submit', () => {
      it('submits multiple selected disabilities sequentially and shows correct success toast', async () => {
        const onSuccessMock = jest.fn();

        render(
          <DisabilitiesInlineForm
            userId="usr_123"
            disabilities={[]}
            onSuccess={onSuccessMock}
          />
        );

        // Open add form
        fireEvent.click(screen.getByRole('button', { name: /add disability/i }));

        // Check Physical Disability and Hearing Impairment
        const physicalCheckbox = screen.getByRole('checkbox', { name: 'Physical Disability' });
        const hearingCheckbox = screen.getByRole('checkbox', { name: 'Hearing Impairment' });

        fireEvent.click(physicalCheckbox);
        fireEvent.click(hearingCheckbox);

        // Save
        const saveBtn = screen.getByRole('button', { name: /save disability/i });
        fireEvent.click(saveBtn);

        await waitFor(() => {
          expect(addUserDisabilityAction).toHaveBeenCalledTimes(2);
          expect(addUserDisabilityAction).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
              userId: 'usr_123',
              disability: 'Physical Disability',
            })
          );
          expect(addUserDisabilityAction).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
              userId: 'usr_123',
              disability: 'Hearing Impairment',
            })
          );
          expect(toast.success).toHaveBeenCalledWith('2 disabilities recorded successfully');
          expect(onSuccessMock).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('2.2 Whitespace-Only Validation for "Others"', () => {
      it('rejects "Others" when Specify Details is whitespace-only', async () => {
        render(
          <DisabilitiesInlineForm
            userId="usr_123"
            disabilities={[]}
          />
        );

        fireEvent.click(screen.getByRole('button', { name: /add disability/i }));

        // Check "Others"
        const othersCheckbox = screen.getByRole('checkbox', { name: 'Others' });
        fireEvent.click(othersCheckbox);

        // Fill whitespace only in details input
        const detailsInput = screen.getByPlaceholderText(/Required: Specify details for "Others"/i);
        fireEvent.change(detailsInput, { target: { value: '    \t   ' } });

        // Click save
        const saveBtn = screen.getByRole('button', { name: /save disability/i });
        fireEvent.click(saveBtn);

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('Please specify details when "Others" is selected.');
          expect(addUserDisabilityAction).not.toHaveBeenCalled();
        });
      });

      it('accepts "Others" when valid details are provided', async () => {
        render(
          <DisabilitiesInlineForm
            userId="usr_123"
            disabilities={[]}
          />
        );

        fireEvent.click(screen.getByRole('button', { name: /add disability/i }));

        const othersCheckbox = screen.getByRole('checkbox', { name: 'Others' });
        fireEvent.click(othersCheckbox);

        const detailsInput = screen.getByPlaceholderText(/Required: Specify details for "Others"/i);
        fireEvent.change(detailsInput, { target: { value: 'Down Syndrome with mobility impairment' } });

        const saveBtn = screen.getByRole('button', { name: /save disability/i });
        fireEvent.click(saveBtn);

        await waitFor(() => {
          expect(addUserDisabilityAction).toHaveBeenCalledWith(
            expect.objectContaining({
              userId: 'usr_123',
              disability: 'Others',
              notes: 'Down Syndrome with mobility impairment',
            })
          );
          expect(toast.success).toHaveBeenCalledWith('Disability recorded successfully');
        });
      });
    });

    describe('2.3 All 6 Disabilities Saturated', () => {
      it('disables all 6 checkboxes and shows (Added) indicator when patient has all 6 recorded', () => {
        const allRecordedDisabilities = STANDARD_DISABILITIES.map((name, index) => ({
          id: index + 1,
          disability: name,
          severity: 'MILD',
          notes: `Detail for ${name}`,
        }));

        render(
          <DisabilitiesInlineForm
            userId="usr_123"
            disabilities={allRecordedDisabilities}
          />
        );

        fireEvent.click(screen.getByRole('button', { name: /add disability/i }));

        // All 6 checkboxes should be disabled and have (Added)
        const addedBadges = screen.getAllByText('(Added)');
        expect(addedBadges.length).toBe(6);

        STANDARD_DISABILITIES.forEach((name) => {
          const checkbox = screen.getByRole('checkbox', { name });
          expect(checkbox).toBeDisabled();
        });
      });

      it('rejects attempt to save when all selected items are already recorded', async () => {
        const singleRecorded = [
          {
            id: 1,
            disability: 'Physical Disability',
            severity: 'MILD',
            notes: null,
          },
        ];

        render(
          <DisabilitiesInlineForm
            userId="usr_123"
            disabilities={singleRecorded}
          />
        );

        fireEvent.click(screen.getByRole('button', { name: /add disability/i }));

        // Try clicking disabled Physical Disability label (or manually triggering state)
        // Since checkbox is disabled, clicking shouldn't toggle it
        const physicalCheckbox = screen.getByRole('checkbox', { name: 'Physical Disability' });
        expect(physicalCheckbox).toBeDisabled();

        // Attempt save with empty selection
        const saveBtn = screen.getByRole('button', { name: /save disability/i });
        fireEvent.click(saveBtn);

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('Please select at least one disability.');
          expect(addUserDisabilityAction).not.toHaveBeenCalled();
        });
      });
    });

    describe('2.4 Inline Editing & Prisma Schema Compatibility', () => {
      it('switches to inline edit mode, updates severity and notes, and calls updateUserDisabilityAction', async () => {
        const onSuccessMock = jest.fn();
        const existingDisability = [
          {
            id: 42,
            disability: 'Visual Impairment',
            severity: 'MILD',
            notes: 'Requires reading glasses',
            dateDiagnosed: '2024-03-15T00:00:00.000Z',
          },
        ];

        render(
          <DisabilitiesInlineForm
            userId="usr_123"
            disabilities={existingDisability}
            onSuccess={onSuccessMock}
          />
        );

        // Click edit button
        const editBtn = screen.getByRole('button', { name: /edit disability/i });
        fireEvent.click(editBtn);

        // Inline edit view should be visible
        expect(screen.getByText('Editing: Visual Impairment')).toBeInTheDocument();

        // Find the details input in edit mode
        const detailsInput = screen.getByDisplayValue('Requires reading glasses');
        fireEvent.change(detailsInput, { target: { value: 'Severe bilateral cataract' } });

        // Click Save
        const saveBtn = screen.getByRole('button', { name: /save/i });
        fireEvent.click(saveBtn);

        await waitFor(() => {
          expect(updateUserDisabilityAction).toHaveBeenCalledWith({
            id: 42,
            severity: 'MILD',
            notes: 'Severe bilateral cataract',
            dateDiagnosed: new Date('2024-03-15T00:00:00.000Z'),
          });
          expect(toast.success).toHaveBeenCalledWith('Disability updated successfully');
          expect(onSuccessMock).toHaveBeenCalledTimes(1);
        });
      });

      it('cancels inline edit mode and restores original view without saving', () => {
        const existingDisability = [
          {
            id: 42,
            disability: 'Visual Impairment',
            severity: 'MILD',
            notes: 'Requires reading glasses',
          },
        ];

        render(
          <DisabilitiesInlineForm
            userId="usr_123"
            disabilities={existingDisability}
          />
        );

        // Click edit
        fireEvent.click(screen.getByRole('button', { name: /edit disability/i }));
        expect(screen.getByText('Editing: Visual Impairment')).toBeInTheDocument();

        // Click Cancel
        const cancelBtn = screen.getByRole('button', { name: /cancel/i });
        fireEvent.click(cancelBtn);

        // Edit view closed, regular view restored
        expect(screen.queryByText('Editing: Visual Impairment')).not.toBeInTheDocument();
        expect(screen.getByText('Visual Impairment')).toBeInTheDocument();
        expect(updateUserDisabilityAction).not.toHaveBeenCalled();
      });
    });
  });
});
