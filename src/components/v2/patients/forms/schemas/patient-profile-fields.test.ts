import { demographicsSchema } from './demographics.schema';
import { addressSchema } from './address.schema';
import { emergencyContactSchema } from './emergency-contact.schema';
import { philHealthSchema, dependentSchema } from './philhealth.schema';
import { vitalsSchema } from './vitals.schema';
import { onboardingBasicInfoSchema } from '@/schemas/onboarding.schema';
import { personalInformationFormSchema } from '@/schemas/personal-information.schema';
import { demographicsSchema as v1DemographicsSchema } from '@/schemas/demographics-schema';
import { vitalSignSchema } from '@/schemas/vital-signs-schema';
import { allergySchema } from '@/schemas/allergy-schema';
import { medicalHistorySchema } from '@/schemas/medical-history-schema';

describe('Patient Profile Input Fields Validation Suite', () => {
  describe('Demographics Fields', () => {
    it('should validate valid demographics with Date object for dob', () => {
      const result = demographicsSchema.safeParse({
        firstName: 'Jane',
        lastName: 'Smith',
        dob: new Date('1992-05-15'),
        gender: 'FEMALE',
        mobile: '09181234567',
        bloodType: 'A_POSITIVE',
        civilStatus: 'SINGLE',
      });
      expect(result.success).toBe(true);
    });

    it('should validate valid demographics with date string for dob', () => {
      const result = demographicsSchema.safeParse({
        firstName: 'Jane',
        lastName: 'Smith',
        dob: '1992-05-15',
        gender: 'FEMALE',
        mobile: '09181234567',
      });
      expect(result.success).toBe(true);
    });

    it('should allow optional fields (middleName, suffix, nickname, religion) to be empty or null', () => {
      const result = demographicsSchema.safeParse({
        firstName: 'Jane',
        lastName: 'Smith',
        dob: '1992-05-15',
        gender: 'FEMALE',
        middleName: null,
        suffix: '',
        nickname: null,
        placeOfBirth: null,
        nationality: null,
        religion: null,
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty firstName or lastName', () => {
      const result = demographicsSchema.safeParse({
        firstName: '',
        lastName: 'Smith',
        dob: '1992-05-15',
        gender: 'FEMALE',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Address Fields', () => {
    it('should validate complete valid address', () => {
      const result = addressSchema.safeParse({
        street: '123 Main St',
        barangay: 'Barangay 1',
        city: 'Quezon City',
        province: 'Metro Manila',
        region: 'NCR',
        zipCode: '1100',
      });
      expect(result.success).toBe(true);
    });

    it('should allow optional barangay, province, region, and zipCode', () => {
      const result = addressSchema.safeParse({
        street: '123 Main St',
        city: 'Manila',
        barangay: null,
        province: null,
        region: null,
        zipCode: null,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid zipCode if provided', () => {
      const result = addressSchema.safeParse({
        street: '123 Main St',
        city: 'Manila',
        zipCode: '12', // Less than 4 digits
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Emergency Contact Fields', () => {
    it('should validate valid emergency contact', () => {
      const result = emergencyContactSchema.safeParse({
        firstName: 'Mary',
        lastName: 'Doe',
        relationship: 'Mother',
        phone: '0917-123-4567',
        address: '456 Side St',
      });
      expect(result.success).toBe(true);
    });

    it('should reject phone numbers that do not unmask to 11 digits', () => {
      const result = emergencyContactSchema.safeParse({
        firstName: 'Mary',
        lastName: 'Doe',
        relationship: 'Mother',
        phone: '12345',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('PhilHealth & Dependent Fields', () => {
    it('should validate valid 12-digit PhilHealth PIN', () => {
      const result = philHealthSchema.safeParse({
        pin: '12-345678901-2',
        tin: '123-456-789',
        philSysId: '1234-5678-9012-3456',
        memberType: 'INFORMAL_ECONOMY',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty PhilHealth fields', () => {
      const result = philHealthSchema.safeParse({
        pin: '',
        tin: '',
        philSysId: '',
        memberType: null,
      });
      expect(result.success).toBe(true);
    });

    it('should validate dependent with Date object or string for dob', () => {
      const resultDate = dependentSchema.safeParse({
        firstName: 'Child',
        lastName: 'Smith',
        relationship: 'Son',
        dob: new Date('2020-01-01'),
      });
      expect(resultDate.success).toBe(true);

      const resultString = dependentSchema.safeParse({
        firstName: 'Child',
        lastName: 'Smith',
        relationship: 'Son',
        dob: '2020-01-01',
      });
      expect(resultString.success).toBe(true);
    });
  });

  describe('Vital Signs Fields', () => {
    it('should validate realistic vital signs range in v2 vitalsSchema', () => {
      const result = vitalsSchema.safeParse({
        systolic: '120',
        diastolic: '80',
        hr: '72',
        rr: '16',
        temp: '36.6',
        height: '170',
        weight: '65',
      });
      expect(result.success).toBe(true);
    });

    it('should reject out-of-range systolic BP', () => {
      const result = vitalsSchema.safeParse({
        systolic: '350', // Exceeds 250 max
      });
      expect(result.success).toBe(false);
    });

    it('should validate numeric vitalSignSchema (v1)', () => {
      const result = vitalSignSchema.safeParse({
        dateTaken: new Date(),
        bpSystolic: 120,
        bpDiastolic: 80,
        pulseRate: 72,
        respRate: 16,
        temp: 36.6,
        height: 170,
        weight: 65,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Onboarding & Personal Information Schemas', () => {
    it('should accept Date and string in onboardingBasicInfoSchema', () => {
      const resultDate = onboardingBasicInfoSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        dob: new Date('1990-01-01'),
        gender: 'MALE',
        mobile: '09171234567',
      });
      expect(resultDate.success).toBe(true);

      const resultString = onboardingBasicInfoSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        dob: '1990-01-01',
        gender: 'MALE',
        mobile: '09171234567',
      });
      expect(resultString.success).toBe(true);
    });

    it('should accept Date and string in personalInformationFormSchema', () => {
      const result = personalInformationFormSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        nickname: 'Johnny',
        religion: 'None',
        nationality: 'Filipino',
        mobile: '09171234567',
        gender: 'MALE',
        bloodType: 'O_POSITIVE',
        civilStatus: 'SINGLE',
        dob: new Date('1990-01-01'),
      });
      expect(result.success).toBe(true);
    });
  });
});
