export const SOAP_ORDER = ['subjective', 'objective', 'assessment', 'plan'] as const;

export type SOAPSectionName = typeof SOAP_ORDER[number];

export interface NoteSectionBase {
  name: string;
  label: string;
  showOnPatient: boolean;
  id?: number;
  noteTemplateId?: number;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface ConsultationNoteSection extends NoteSectionBase {
  value?: string;
  content?: string;
}

export function isSOAPSection(sectionName: string): sectionName is SOAPSectionName {
  return SOAP_ORDER.includes(sectionName as SOAPSectionName);
}

export function getSOAPOrder(sectionName: string): number {
  const index = SOAP_ORDER.indexOf(sectionName as SOAPSectionName);
  return index;
}

export function sortNoteSectionsSOAP<T extends NoteSectionBase>(sections: T[]): T[] {
  if (!sections || sections.length === 0) {
    return [];
  }

  return [...sections].sort((a, b) => {
    const aOrder = a.sortOrder ?? 0;
    const bOrder = b.sortOrder ?? 0;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    // Stable tiebreaker: insertion order (id ascending)
    if (a.id !== undefined && b.id !== undefined) {
      return a.id - b.id;
    }
    return 0;
  });
}

export interface ConsultationNoteData {
  section: string;
  content?: string;
  showOnPatient?: boolean;
  id?: number;
  consultationTicketId?: number;
  hpId?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export function createOrderedConsultationNotes(
  templateSections: NoteSectionBase[],
  consultationNotes?: ConsultationNoteData[]
): ConsultationNoteSection[] {
  if (!templateSections || templateSections.length === 0) {
    return [];
  }

  const notes = templateSections.map(section => {
    const existingNote = consultationNotes?.find(note => note.section === section.name);
    return {
      ...section,
      showOnPatient: existingNote?.showOnPatient ?? section.showOnPatient,
      value: existingNote?.content ?? "",
      content: existingNote?.content ?? ""
    };
  });

  return sortNoteSectionsSOAP(notes);
}

export function isValidNoteSection(obj: unknown): obj is NoteSectionBase {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof obj === 'object' &&
    typeof (obj as Record<string, unknown>).name === 'string' &&
    typeof (obj as Record<string, unknown>).label === 'string' &&
    typeof (obj as Record<string, unknown>).showOnPatient === 'boolean'
  );
}

export function validateSOAPSections(sections: NoteSectionBase[]): {
  isValid: boolean;
  missing: SOAPSectionName[];
  present: SOAPSectionName[];
} {
  const presentSoapSections = sections
    .filter(section => isSOAPSection(section.name))
    .map(section => section.name as SOAPSectionName);

  const missingSoapSections = SOAP_ORDER.filter(
    soapName => !presentSoapSections.includes(soapName)
  );

  return {
    isValid: missingSoapSections.length === 0,
    missing: missingSoapSections,
    present: presentSoapSections
  };
}