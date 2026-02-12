import {
  onboardingBasicInfoSchema,
} from "./onboarding.schema";

describe("onboardingBasicInfoSchema", () => {
  it("should pass with valid required fields", () => {
    const result = onboardingBasicInfoSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      dob: new Date("1990-01-15"),
      gender: "MALE",
      mobile: "09171234567",
    });
    expect(result.success).toBe(true);
  });

  it("should fail when firstName is empty", () => {
    const result = onboardingBasicInfoSchema.safeParse({
      firstName: "",
      lastName: "Doe",
      dob: new Date("1990-01-15"),
      gender: "MALE",
      mobile: "09171234567",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when firstName is whitespace only", () => {
    const result = onboardingBasicInfoSchema.safeParse({
      firstName: "   ",
      lastName: "Doe",
      dob: new Date("1990-01-15"),
      gender: "MALE",
      mobile: "09171234567",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when lastName is missing", () => {
    const result = onboardingBasicInfoSchema.safeParse({
      firstName: "John",
      dob: new Date("1990-01-15"),
      gender: "MALE",
      mobile: "09171234567",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when dob is in the future", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const result = onboardingBasicInfoSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      dob: futureDate,
      gender: "MALE",
      mobile: "09171234567",
    });
    expect(result.success).toBe(false);
  });

  it("should fail with invalid gender value", () => {
    const result = onboardingBasicInfoSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      dob: new Date("1990-01-15"),
      gender: "INVALID",
      mobile: "09171234567",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when mobile is too short", () => {
    const result = onboardingBasicInfoSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      dob: new Date("1990-01-15"),
      gender: "MALE",
      mobile: "123",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when mobile is too long", () => {
    const result = onboardingBasicInfoSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      dob: new Date("1990-01-15"),
      gender: "MALE",
      mobile: "1234567890123456",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when mobile is missing", () => {
    const result = onboardingBasicInfoSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      dob: new Date("1990-01-15"),
      gender: "MALE",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when all fields are missing", () => {
    const result = onboardingBasicInfoSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
