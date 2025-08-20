"use client";

export const isValidStudentId = (studentId: unknown): studentId is string => {
  return typeof studentId === 'string' && studentId.trim().length > 0;
}

export const getFullName = ({ firstName, middleName, lastName, suffix }: {
  firstName: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
}) => {
  let fullName = `${firstName} ${lastName}`;

  if (middleName) {
    fullName = `${firstName} ${middleName} ${lastName}`;
  }

  if (suffix) {
    fullName += `, ${suffix}`;
  }

  return fullName.trim();
}
