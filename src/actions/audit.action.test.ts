import { diffFields } from "../lib/audit-utils";

describe("diffFields", () => {
  it("should return empty array when no fields changed", () => {
    const previous = { firstName: "John", lastName: "Doe" };
    const updated = { firstName: "John", lastName: "Doe" };
    const result = diffFields(previous, updated, ["firstName", "lastName"]);
    expect(result).toEqual([]);
  });

  it("should detect a single field change", () => {
    const previous = { firstName: "John", lastName: "Doe" };
    const updated = { firstName: "Jane", lastName: "Doe" };
    const result = diffFields(previous, updated, ["firstName", "lastName"]);
    expect(result).toEqual([
      { fieldName: "firstName", previousValue: "John", newValue: "Jane" },
    ]);
  });

  it("should detect multiple field changes", () => {
    const previous = { firstName: "John", lastName: "Doe", email: "a@b.com" };
    const updated = { firstName: "Jane", lastName: "Smith", email: "a@b.com" };
    const result = diffFields(previous, updated, [
      "firstName",
      "lastName",
      "email",
    ]);
    expect(result).toEqual([
      { fieldName: "firstName", previousValue: "John", newValue: "Jane" },
      { fieldName: "lastName", previousValue: "Doe", newValue: "Smith" },
    ]);
  });

  it("should handle null to value changes", () => {
    const previous = { firstName: null, lastName: "Doe" };
    const updated = { firstName: "John", lastName: "Doe" };
    const result = diffFields(
      previous as Record<string, unknown>,
      updated as Record<string, unknown>,
      ["firstName", "lastName"]
    );
    expect(result).toEqual([
      { fieldName: "firstName", previousValue: undefined, newValue: "John" },
    ]);
  });

  it("should handle value to null changes", () => {
    const previous = { firstName: "John", lastName: "Doe" };
    const updated = { firstName: null, lastName: "Doe" };
    const result = diffFields(
      previous as Record<string, unknown>,
      updated as Record<string, unknown>,
      ["firstName", "lastName"]
    );
    expect(result).toEqual([
      { fieldName: "firstName", previousValue: "John", newValue: undefined },
    ]);
  });

  it("should handle undefined fields", () => {
    const previous = { lastName: "Doe" };
    const updated = { firstName: "John", lastName: "Doe" };
    const result = diffFields(
      previous as Record<string, unknown>,
      updated as Record<string, unknown>,
      ["firstName", "lastName"]
    );
    expect(result).toEqual([
      { fieldName: "firstName", previousValue: undefined, newValue: "John" },
    ]);
  });

  it("should convert non-string values to strings for comparison", () => {
    const previous = { age: 25, active: true };
    const updated = { age: 30, active: false };
    const result = diffFields(
      previous as Record<string, unknown>,
      updated as Record<string, unknown>,
      ["age", "active"]
    );
    expect(result).toEqual([
      { fieldName: "age", previousValue: "25", newValue: "30" },
      { fieldName: "active", previousValue: "true", newValue: "false" },
    ]);
  });

  it("should only check specified fields", () => {
    const previous = { firstName: "John", lastName: "Doe", email: "old@test.com" };
    const updated = { firstName: "John", lastName: "Smith", email: "new@test.com" };
    const result = diffFields(previous, updated, ["firstName"]);
    expect(result).toEqual([]);
  });

  it("should handle empty fields array", () => {
    const previous = { firstName: "John" };
    const updated = { firstName: "Jane" };
    const result = diffFields(previous, updated, []);
    expect(result).toEqual([]);
  });
});
