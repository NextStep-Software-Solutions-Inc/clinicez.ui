import React, { act } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
(global as any).ResizeObserver = MockResizeObserver;
if (typeof window !== 'undefined') {
  (window as any).ResizeObserver = MockResizeObserver;
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
}
Element.prototype.scrollIntoView = jest.fn();

import { PhysicalExamInlineForm } from './PhysicalExamInlineForm';
import {
  savePhysicalExaminationAction,
  deletePhysicalExaminationAction,
} from '@/actions/physical-exam.action';
import { getPhysicalExamLibrariesAction } from '@/actions/super-admin/physical-exam-library.action';
import { toast } from 'sonner';

// Mock server actions
jest.mock('@/actions/physical-exam.action', () => ({
  savePhysicalExaminationAction: jest.fn(),
  deletePhysicalExaminationAction: jest.fn(),
}));

jest.mock('@/actions/super-admin/physical-exam-library.action', () => ({
  getPhysicalExamLibrariesAction: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const mockLibraries = [
  // GENSURVEY (Single Select)
  { id: '1', category: 'GENSURVEY', code: '1', description: 'Conscious, coherent, ambulatory' },
  { id: '2', category: 'GENSURVEY', code: '2', description: 'Lethargic' },

  // HEENT
  { id: '3', category: 'HEENT', code: '11', description: 'Essentially normal' },
  { id: '4', category: 'HEENT', code: '1', description: 'Anicteric sclerae' },
  { id: '5', category: 'HEENT', code: '2', description: 'Pupils equal and reactive' },
  { id: '6', category: 'HEENT', code: '99', description: 'Others' },

  // CHEST
  { id: '7', category: 'CHEST', code: '6', description: 'Essentially normal' },
  { id: '8', category: 'CHEST', code: '1', description: 'Clear breath sounds' },
  { id: '9', category: 'CHEST', code: '2', description: 'Rales / Crackles' },
  { id: '10', category: 'CHEST', code: '99', description: 'Others' },

  // HEART
  { id: '11', category: 'HEART', code: '5', description: 'Essentially normal' },
  { id: '12', category: 'HEART', code: '1', description: 'Normal rate, regular rhythm' },
  { id: '13', category: 'HEART', code: '3', description: 'Murmur' },
  { id: '14', category: 'HEART', code: '99', description: 'Others' },

  // ABDOMEN
  { id: '15', category: 'ABDOMEN', code: '7', description: 'Essentially normal' },
  { id: '16', category: 'ABDOMEN', code: '1', description: 'Flat, soft' },
  { id: '17', category: 'ABDOMEN', code: '99', description: 'Others' },

  // GU
  { id: '18', category: 'GU', code: '1', description: 'Essentially normal' },
  { id: '19', category: 'GU', code: '99', description: 'Others' },

  // SKIN
  { id: '20', category: 'SKIN', code: '1', description: 'Essentially normal' },
  { id: '21', category: 'SKIN', code: '2', description: 'Pallor' },
  { id: '22', category: 'SKIN', code: '99', description: 'Others' },

  // NEURO
  { id: '23', category: 'NEURO', code: '6', description: 'Essentially normal' },
  { id: '24', category: 'NEURO', code: '1', description: 'Oriented x 3' },
  { id: '25', category: 'NEURO', code: '99', description: 'Others' },

  // RECTAL
  { id: '26', category: 'RECTAL', code: '1', description: 'Essentially normal' },
  { id: '27', category: 'RECTAL', code: '0', description: 'Not Applicable' },
  { id: '28', category: 'RECTAL', code: '99', description: 'Others' },
];

describe('PhysicalExamInlineForm (Issue #507)', () => {
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
  });

  // =========================================================================
  // Tier 1: Feature Coverage (Happy Path)
  // =========================================================================
  describe('Tier 1: Feature Coverage (Happy Path)', () => {
    it('loads physical exam libraries on mount and renders all 9 body systems', async () => {
      render(<PhysicalExamInlineForm patientId={1} />);

      await waitFor(() => {
        expect(getPhysicalExamLibrariesAction).toHaveBeenCalledTimes(1);
        expect(screen.getByText('General Survey')).toBeInTheDocument();
      });

      expect(screen.getByText('Head, Eyes, Ears, Nose, Throat')).toBeInTheDocument();
      expect(screen.getByText('Chest/Lungs')).toBeInTheDocument();
      expect(screen.getByText('Cardiovascular System')).toBeInTheDocument();
      expect(screen.getByText('Abdomen')).toBeInTheDocument();
      expect(screen.getByText('Genitourinary')).toBeInTheDocument();
      expect(screen.getByText('Skin/Extremities')).toBeInTheDocument();
      expect(screen.getByText('Neurological')).toBeInTheDocument();
      expect(screen.getByText('Rectal')).toBeInTheDocument();
    });

    it('displays initial multi-selected findings correctly from currentData', async () => {
      render(
        <PhysicalExamInlineForm
          patientId={1}
          currentData={{
            heentId: '1,2',
            heentRemarks: 'Pupils reactive, sclerae clear',
            chestId: '6',
          }}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Head, Eyes, Ears, Nose, Throat')).toBeInTheDocument();
      });

      // HEENT remarks input populated
      const heentRemarks = screen.getByDisplayValue('Pupils reactive, sclerae clear');
      expect(heentRemarks).toBeInTheDocument();
    });

    it('submits form payload with multi-selected findings and remarks', async () => {
      render(
        <PhysicalExamInlineForm
          patientId={123}
          currentData={{
            id: 42,
            generalSurveyId: '1',
            heentId: '1,2',
            heentRemarks: 'Normal pupils',
            chestId: '6',
          }}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Head, Eyes, Ears, Nose, Throat')).toBeInTheDocument();
      });

      // Modify remarks to trigger dirty state
      const heentInput = screen.getByDisplayValue('Normal pupils');
      fireEvent.change(heentInput, { target: { value: 'Updated HEENT findings' } });

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(savePhysicalExaminationAction).toHaveBeenCalledTimes(1);
        expect(savePhysicalExaminationAction).toHaveBeenCalledWith(
          123,
          expect.objectContaining({
            heentId: '1,2',
            heentRemarks: 'Updated HEENT findings',
            chestId: '6',
          }),
          '42'
        );
      });
    });

    it('calls deletePhysicalExaminationAction when delete button is confirmed', async () => {
      window.confirm = jest.fn().mockReturnValue(true);

      render(
        <PhysicalExamInlineForm
          patientId={123}
          currentData={{ id: 99 }}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Delete Exam Record')).toBeInTheDocument();
      });

      const deleteBtn = screen.getByText('Delete Exam Record');
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(deletePhysicalExaminationAction).toHaveBeenCalledWith('99');
      });
    });
  });

  // =========================================================================
  // Tier 2: Boundary & Corner Cases (Mutual Exclusivity & Autofocus)
  // =========================================================================
  describe('Tier 2: Boundary & Corner Cases', () => {
    it('parses initial semicolon-delimited values seamlessly without errors', async () => {
      render(
        <PhysicalExamInlineForm
          patientId={1}
          currentData={{
            heentId: '1;2;99',
            heentRemarks: 'Pale conjunctiva',
          }}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Pale conjunctiva')).toBeInTheDocument();
      });
    });

    it('renders PESPECIFIC badge when "Others" (99) is in initialData', async () => {
      render(
        <PhysicalExamInlineForm
          patientId={1}
          currentData={{
            heentId: '99',
            heentRemarks: 'Sunken eyes',
          }}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Head, Eyes, Ears, Nose, Throat')).toBeInTheDocument();
      });

      const badges = screen.queryAllByText('PESPECIFIC');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it('handles empty currentData and undefined exam id gracefully', async () => {
      render(<PhysicalExamInlineForm patientId={55} currentData={{}} />);

      await waitFor(() => {
        expect(screen.getByText('Head, Eyes, Ears, Nose, Throat')).toBeInTheDocument();
      });

      // No delete button when no examId
      expect(screen.queryByText('Delete Exam Record')).not.toBeInTheDocument();
    });

    it('notifies user with toast.info when saving with no changes', async () => {
      render(
        <PhysicalExamInlineForm
          patientId={1}
          currentData={{
            heentId: '11',
            chestId: '6',
          }}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      });

      const saveBtn = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveBtn);

      expect(toast.info).toHaveBeenCalledWith('No changes to save');
      expect(savePhysicalExaminationAction).not.toHaveBeenCalled();
    });

    it('clears abnormal findings when "Essentially normal" is selected (mutual exclusivity)', async () => {
      render(
        <PhysicalExamInlineForm
          patientId={1}
          currentData={{
            heentId: '1,2',
            heentRemarks: 'Pupils reactive, sclerae clear',
          }}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Head, Eyes, Ears, Nose, Throat')).toBeInTheDocument();
      });

      // Verify abnormal badges are initially rendered
      expect(screen.getByText('Anicteric sclerae')).toBeInTheDocument();
      expect(screen.getByText('Pupils equal and reactive')).toBeInTheDocument();

      // Open HEENT combobox (index 1: 0 is generalSurvey, 1 is heent)
      const comboboxes = screen.getAllByRole('combobox');
      fireEvent.click(comboboxes[1]);

      await waitFor(() => {
        expect(screen.getByText('Essentially normal')).toBeInTheDocument();
      });

      // Click "Essentially normal" option
      const normalOption = screen.getByText('Essentially normal');
      fireEvent.click(normalOption);

      // Close HEENT combobox dropdown
      fireEvent.click(comboboxes[1]);

      // Verify abnormal badges are removed and "Essentially normal" badge is displayed
      await waitFor(() => {
        expect(screen.queryByText('Anicteric sclerae')).not.toBeInTheDocument();
        expect(screen.queryByText('Pupils equal and reactive')).not.toBeInTheDocument();
        expect(screen.getByText('Essentially normal')).toBeInTheDocument();
      });

      // Verify saving submits the mutually exclusive normal finding
      const saveBtn = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(savePhysicalExaminationAction).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            heentId: '11',
          }),
          undefined
        );
      });
    });

    it('focuses the remarks input when "Others" (99) is selected', async () => {
      render(
        <PhysicalExamInlineForm
          patientId={1}
          currentData={{
            heentId: '1',
            heentRemarks: '',
          }}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Head, Eyes, Ears, Nose, Throat')).toBeInTheDocument();
      });

      // Open HEENT combobox
      const comboboxes = screen.getAllByRole('combobox');
      fireEvent.click(comboboxes[1]);

      await waitFor(() => {
        expect(screen.getByText('Others')).toBeInTheDocument();
      });

      // Click "Others" (99) option
      const othersOption = screen.getByText('Others');
      fireEvent.click(othersOption);

      // Verify autofocus on remarks input
      await waitFor(() => {
        const remarksInput = document.getElementById('HEENT-remarks');
        expect(document.activeElement).toBe(remarksInput);
      });

      // Verify PESPECIFIC badge is visible
      expect(screen.getByText('PESPECIFIC')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Tier 3: Cross-Feature Integration (Dirty Tracking & saveRef)
  // =========================================================================
  describe('Tier 3: Cross-Feature Integration', () => {
    it('notifies parent via onDirtyChange when user modifies fields', async () => {
      const onDirtyChangeMock = jest.fn();

      render(
        <PhysicalExamInlineForm
          patientId={1}
          currentData={{ heentRemarks: 'Normal' }}
          onDirtyChange={onDirtyChangeMock}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Normal')).toBeInTheDocument();
      });

      const remarksInput = screen.getByDisplayValue('Normal');
      fireEvent.change(remarksInput, { target: { value: 'Abnormal finding noted' } });

      expect(onDirtyChangeMock).toHaveBeenCalledWith(true);
    });

    it('attaches submit handle and hasChanges to external saveRef', async () => {
      const saveRef = { current: null as any };

      render(
        <PhysicalExamInlineForm
          patientId={1}
          currentData={{ heentRemarks: 'Initial text' }}
          saveRef={saveRef}
        />
      );

      await waitFor(() => {
        expect(saveRef.current).not.toBeNull();
        expect(screen.getByDisplayValue('Initial text')).toBeInTheDocument();
      });

      expect(typeof saveRef.current.submit).toBe('function');
      expect(saveRef.current.hasChanges).toBe(false);

      // Save button at bottom should not be rendered when saveRef is provided
      expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();

      // Change input
      const input = screen.getByDisplayValue('Initial text');
      fireEvent.change(input, { target: { value: 'Modified text' } });

      expect(saveRef.current.hasChanges).toBe(true);

      // Trigger submit via saveRef
      await act(async () => {
        await saveRef.current.submit();
      });

      expect(savePhysicalExaminationAction).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // Tier 4: Real-World Workflow Scenarios
  // =========================================================================
  describe('Tier 4: Real-World Clinical Physical Examination Scenario', () => {
    it('submits a complete multi-system physical examination with normal and abnormal systems', async () => {
      const onSuccessMock = jest.fn();

      render(
        <PhysicalExamInlineForm
          patientId={500}
          onSuccess={onSuccessMock}
          currentData={{
            generalSurveyId: '1',
            generalSurveyRemarks: 'Alert and ambulatory',
            heentId: '1,2',
            heentRemarks: 'Anicteric sclerae, pupils equal',
            chestId: '6',
            chestRemarks: '',
            heartId: '5',
            heartRemarks: '',
            abdomenId: '7',
            abdomenRemarks: '',
            guId: '1',
            skinId: '1',
            neuroId: '6',
            rectalId: '1',
          }}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Alert and ambulatory')).toBeInTheDocument();
      });

      // Modify skin remarks
      const skinRemarks = screen.getAllByPlaceholderText(/details/i)[6]; // skin remarks
      fireEvent.change(skinRemarks, { target: { value: 'Warm, good turgor' } });

      const saveBtn = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(savePhysicalExaminationAction).toHaveBeenCalledWith(
          500,
          expect.objectContaining({
            generalSurveyId: '1',
            heentId: '1,2',
            chestId: '6',
            heartId: '5',
            skinRemarks: 'Warm, good turgor',
          }),
          undefined
        );
        expect(onSuccessMock).toHaveBeenCalledTimes(1);
      });
    });
  });
});
