export const isValidStudentId = (studentId: unknown): studentId is string => {
  return typeof studentId === 'string' && studentId.trim().length > 0;
}

export const getFullName = ({ firstName, middleName, lastName, suffix }: {
  firstName: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
}) => {
  const nameParts = [firstName, middleName, lastName].filter(Boolean);
  let fullName = nameParts.join(' ');

  if (suffix) {
    fullName += `, ${suffix}`;
  }

  return fullName.trim();
}

export const getDepartmentName = (requesterUser?: {
  StudentRecords?: Array<{
    Department?: {
      name?: string | null;
    } | null;
  }>;
  UserEmployments?: Array<{
    Department?: {
      name?: string | null;
    } | null;
  }>;
}) => {
  if (!requesterUser) return undefined;
  const departmentFromStudentRecord = requesterUser.StudentRecords?.find((record) => record.Department?.name)?.Department?.name;
  if (departmentFromStudentRecord) return departmentFromStudentRecord;
  const departmentFromEmployment = requesterUser.UserEmployments?.find((employment) => employment.Department?.name)?.Department?.name;
  return departmentFromEmployment ?? undefined;
}

export const getProgramYear = (userRecord?: {
  StudentRecords?: Array<{
    Program?: { name?: string | null; major?: string | null } | null;
    OrganizationYearLevel?: { name?: string | null } | null;
  }>;
}) => {
  if (!userRecord) return undefined;
  const studentRecord = userRecord.StudentRecords?.[0];
  if (!studentRecord) return undefined;
  
  const programName = studentRecord.Program?.name;
  const major = studentRecord.Program?.major;
  const yearLevel = studentRecord.OrganizationYearLevel?.name;
  
  if (programName || yearLevel) {
    const parts = [];
    if (programName) {
      parts.push(major ? `${programName} (${major})` : programName);
    }
    if (yearLevel) {
      parts.push(yearLevel);
    }
    return parts.join(' - ');
  }
  return undefined;
}
