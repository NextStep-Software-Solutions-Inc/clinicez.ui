import { demographicsSchema } from './demographics.schema';
import { addressSchema } from './address.schema';
import { emergencyContactSchema } from './emergency-contact.schema';
import { philHealthSchema, dependentSchema } from './philhealth.schema';
import { vitalsSchema } from './vitals.schema';
import { onboardingBasicInfoSchema } from '@/schemas/onboarding.schema';
import { normalizeDobToUtcNoon } from '@/lib/utils';

describe('Simulate User Entry - Patient Profile Forms', () => {
  it('Simulate 1: Complete Basic Info Onboarding Form Submission', () => {
    // User fills out onboarding form:
    const userInputs = {
      firstName: 'Bob',
      lastName: 'Smith',
      dob: new Date('1995-07-24T00:00:00.000+08:00'), // Selected July 24 in GMT+8
      gender: 'MALE',
      mobile: '09171234567',
    };

    // 1. Zod Schema Validation
    const validation = onboardingBasicInfoSchema.safeParse(userInputs);
    expect(validation.success).toBe(true);

    // 2. UTC Noon Normalization for Database Persistence
    if (validation.success) {
      const normalizedDob = normalizeDobToUtcNoon(validation.data.dob);
      expect(normalizedDob).not.toBeNull();
      expect(normalizedDob?.getUTCFullYear()).toBe(1995);
      expect(normalizedDob?.getUTCMonth()).toBe(6); // July (0-indexed)
      expect(normalizedDob?.getUTCDate()).toBe(24); // Guaranteed day 24!
      expect(normalizedDob?.getUTCHours()).toBe(12); // Guaranteed 12:00 UTC
    }
  });

  it('Simulate 2: Demographics Inline Form Entry & Update', () => {
    // User types into DemographicsInlineForm:
    const userInputs = {
      firstName: 'Robert',
      middleName: 'Del Rosario',
      lastName: 'Smith',
      suffix: 'Jr.',
      nickname: 'Bob',
      dob: new Date('1995-07-24'),
      gender: 'MALE',
      bloodType: 'O_POSITIVE',
      civilStatus: 'MARRIED',
      placeOfBirth: 'Quezon City',
      nationality: 'Filipino',
      religion: 'Catholic',
      mobile: '0917-123-4567', // Masked phone number input from UI
      telephone: '02-8123-4567',
    };

    const validation = demographicsSchema.safeParse(userInputs);
    expect(validation.success).toBe(true);

    if (validation.success) {
      expect(validation.data.mobile).toBe('09171234567'); // Unmasked to 11 digits
      const normalizedDob = normalizeDobToUtcNoon(validation.data.dob);
      expect(normalizedDob?.getUTCDate()).toBe(24);
    }
  });

  it('Simulate 3: Address Form Cascading Location Selection & Entry', () => {
    const userInputs = {
      street: '123 Commonwealth Ave',
      barangay: 'Batasan Hills',
      city: 'Quezon City',
      province: 'Metro Manila',
      region: 'NCR',
      zipCode: '1126',
    };

    const validation = addressSchema.safeParse(userInputs);
    expect(validation.success).toBe(true);
    if (validation.success) {
      expect(validation.data.zipCode).toBe('1126');
    }
  });

  it('Simulate 4: Emergency Contact Entry', () => {
    const userInputs = {
      firstName: 'Maria',
      middleName: 'Gomez',
      lastName: 'Smith',
      relationship: 'Spouse',
      phone: '0918-987-6543', // Masked entry
      address: '123 Commonwealth Ave, Quezon City',
    };

    const validation = emergencyContactSchema.safeParse(userInputs);
    expect(validation.success).toBe(true);

    if (validation.success) {
      expect(validation.data.phone).toBe('09189876543'); // Unmasked to 11 digits
    }
  });

  it('Simulate 5: PhilHealth Member & Dependent Entry', () => {
    // PhilHealth Record
    const philHealthInputs = {
      pin: '12-345678901-2',
      tin: '123-456-789',
      philSysId: '1234-5678-9012-3456',
      memberType: 'INFORMAL_ECONOMY',
    };

    const phValidation = philHealthSchema.safeParse(philHealthInputs);
    expect(phValidation.success).toBe(true);

    // Dependent Record
    const dependentInputs = {
      firstName: 'Timmy',
      lastName: 'Smith',
      relationship: 'Son',
      gender: 'MALE',
      dob: new Date('2018-07-15'),
    };

    const depValidation = dependentSchema.safeParse(dependentInputs);
    expect(depValidation.success).toBe(true);
  });

  it('Simulate 6: Vital Signs Measurement Entry', () => {
    const vitalsInputs = {
      systolic: '118',
      diastolic: '78',
      hr: '72',
      rr: '16',
      temp: '36.6',
      height: '175',
      weight: '70',
    };

    const validation = vitalsSchema.safeParse(vitalsInputs);
    expect(validation.success).toBe(true);
  });
});
