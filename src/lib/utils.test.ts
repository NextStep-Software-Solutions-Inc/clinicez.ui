import { calculateAge } from './utils';
import dayjs from './day-utils';

describe('calculateAge', () => {
  it('should return correct age for a valid date', () => {
    // Set a fixed date for testing (e.g., January 1, 2020)
    const birthDate = new Date('1990-01-01');
    const currentYear = dayjs().year();
    const expectedAge = currentYear - 1990;
    
    const age = calculateAge(birthDate);
    expect(age).toBe(expectedAge);
  });

  it('should return correct age for a valid date string', () => {
    const birthDate = '1990-01-01';
    const currentYear = dayjs().year();
    const expectedAge = currentYear - 1990;
    
    const age = calculateAge(birthDate);
    expect(age).toBe(expectedAge);
  });

  it('should return null for null date', () => {
    const age = calculateAge(null);
    expect(age).toBe(null);
  });

  it('should return null for undefined date', () => {
    const age = calculateAge(undefined);
    expect(age).toBe(null);
  });

  it('should return null for invalid date string', () => {
    const age = calculateAge('invalid-date');
    expect(age).toBe(null);
  });

  it('should return null for invalid Date object', () => {
    const invalidDate = new Date('invalid');
    const age = calculateAge(invalidDate);
    expect(age).toBe(null);
  });

  it('should handle leap year dates correctly', () => {
    const birthDate = new Date('2000-02-29');
    const currentYear = dayjs().year();
    const expectedAge = currentYear - 2000;
    
    const age = calculateAge(birthDate);
    expect(age).toBe(expectedAge);
  });

  it('should return 0 for someone born this year', () => {
    const currentYear = dayjs().year();
    const birthDate = new Date(`${currentYear}-01-01`);
    
    const age = calculateAge(birthDate);
    expect(age).toBe(0);
  });

  it('should handle future dates (return negative age)', () => {
    const futureDate = dayjs().add(5, 'year').toDate();
    const age = calculateAge(futureDate);
    expect(age).toBeLessThan(0);
  });
});
