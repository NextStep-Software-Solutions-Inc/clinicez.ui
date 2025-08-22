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
