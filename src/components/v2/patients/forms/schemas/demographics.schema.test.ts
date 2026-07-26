import { demographicsSchema } from './demographics.schema';

describe('demographicsSchema (v2)', () => {
  it('should accept dob as a Date object', () => {
    const result = demographicsSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      dob: new Date('1995-07-24'),
      gender: 'MALE',
    });
    expect(result.success).toBe(true);
  });

  it('should accept dob as a date string', () => {
    const result = demographicsSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      dob: '1995-07-24',
      gender: 'MALE',
    });
    expect(result.success).toBe(true);
  });

  it('should validate mobile and mobileNo fields correctly', () => {
    const resultWithMobile = demographicsSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      dob: '1995-07-24',
      gender: 'MALE',
      mobile: '09171234567',
    });
    expect(resultWithMobile.success).toBe(true);

    const resultWithMobileNo = demographicsSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      dob: '1995-07-24',
      gender: 'MALE',
      mobileNo: '09171234567',
    });
    expect(resultWithMobileNo.success).toBe(true);
  });
});
