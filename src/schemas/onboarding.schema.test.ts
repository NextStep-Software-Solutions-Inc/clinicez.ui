import {
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
  onboardingFullSchema,
  ONBOARDING_STEPS,
} from "./onboarding.schema";

describe("onboardingStep1Schema", () => {
  it("should pass with valid required fields", () => {
    const result = onboardingStep1Schema.safeParse({
      firstName: "John",
      lastName: "Doe",
      dob: new Date("1990-01-15"),
      gender: "MALE",
    });
    expect(result.success).toBe(true);
  });

  it("should fail when firstName is empty", () => {
    const result = onboardingStep1Schema.safeParse({
      firstName: "",
      lastName: "Doe",
      dob: new Date("1990-01-15"),
      gender: "MALE",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when firstName is whitespace only", () => {
    const result = onboardingStep1Schema.safeParse({
      firstName: "   ",
      lastName: "Doe",
      dob: new Date("1990-01-15"),
      gender: "MALE",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when lastName is missing", () => {
    const result = onboardingStep1Schema.safeParse({
      firstName: "John",
      dob: new Date("1990-01-15"),
      gender: "MALE",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when dob is in the future", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const result = onboardingStep1Schema.safeParse({
      firstName: "John",
      lastName: "Doe",
      dob: futureDate,
      gender: "MALE",
    });
    expect(result.success).toBe(false);
  });

  it("should fail with invalid gender value", () => {
    const result = onboardingStep1Schema.safeParse({
      firstName: "John",
      lastName: "Doe",
      dob: new Date("1990-01-15"),
      gender: "INVALID",
    });
    expect(result.success).toBe(false);
  });
});

describe("onboardingStep2Schema", () => {
  it("should pass with valid contact information", () => {
    const result = onboardingStep2Schema.safeParse({
      mobile: "09171234567",
      email: "john@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("should fail when mobile is too short", () => {
    const result = onboardingStep2Schema.safeParse({
      mobile: "123",
      email: "john@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when mobile is too long", () => {
    const result = onboardingStep2Schema.safeParse({
      mobile: "1234567890123456",
      email: "john@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when email is invalid", () => {
    const result = onboardingStep2Schema.safeParse({
      mobile: "09171234567",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when email is missing", () => {
    const result = onboardingStep2Schema.safeParse({
      mobile: "09171234567",
    });
    expect(result.success).toBe(false);
  });
});

describe("onboardingStep3Schema", () => {
  it("should pass with all optional fields empty", () => {
    const result = onboardingStep3Schema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should pass with some optional fields filled", () => {
    const result = onboardingStep3Schema.safeParse({
      middleName: "Michael",
      nationality: "Filipino",
      civilStatus: "SINGLE",
    });
    expect(result.success).toBe(true);
  });

  it("should pass with all optional fields filled", () => {
    const result = onboardingStep3Schema.safeParse({
      middleName: "Michael",
      suffix: "Jr.",
      nickname: "Mike",
      placeOfBirth: "Manila",
      civilStatus: "MARRIED",
      bloodType: "O_POSITIVE",
      telephone: "02-1234567",
      religion: "Catholic",
      nationality: "Filipino",
    });
    expect(result.success).toBe(true);
  });

  it("should fail when telephone is too long", () => {
    const result = onboardingStep3Schema.safeParse({
      telephone: "a".repeat(31),
    });
    expect(result.success).toBe(false);
  });

  it("should accept null values for optional fields", () => {
    const result = onboardingStep3Schema.safeParse({
      middleName: null,
      suffix: null,
      nickname: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("onboardingFullSchema", () => {
  it("should pass with all required and some optional fields", () => {
    const result = onboardingFullSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      dob: new Date("1990-01-15"),
      gender: "MALE",
      mobile: "09171234567",
      email: "john@example.com",
      middleName: "Michael",
      nationality: "Filipino",
    });
    expect(result.success).toBe(true);
  });

  it("should fail when required fields from step 1 are missing", () => {
    const result = onboardingFullSchema.safeParse({
      mobile: "09171234567",
      email: "john@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when required fields from step 2 are missing", () => {
    const result = onboardingFullSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      dob: new Date("1990-01-15"),
      gender: "MALE",
    });
    expect(result.success).toBe(false);
  });
});

describe("ONBOARDING_STEPS", () => {
  it("should have 4 steps", () => {
    expect(ONBOARDING_STEPS).toHaveLength(4);
  });

  it("should have the correct step names", () => {
    const names = ONBOARDING_STEPS.map((s) => s.name);
    expect(names).toEqual(["basic-info", "contact", "additional", "review"]);
  });

  it("should have labels for each step", () => {
    ONBOARDING_STEPS.forEach((step) => {
      expect(step.label).toBeTruthy();
    });
  });
});
