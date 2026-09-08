import { describe, expect, it } from "vitest";

import { loginSchema, registerSchema } from "./auth";

describe("authentication DTO validation", () => {
  it("accepts a strong registration payload", () => {
    expect(
      registerSchema.safeParse({
        email: "developer@example.com",
        username: "queen_dev",
        password: "StrongPass1",
      }).success,
    ).toBe(true);
  });

  it("accepts optional professional details", () => {
    expect(
      registerSchema.safeParse({
        email: "developer@example.com",
        username: "queen_dev",
        password: "StrongPass1",
        programmingLanguages: ["TypeScript", "Python"],
        githubUrl: "https://github.com/queen_dev",
        yearsOfExperience: 3,
        jobTitle: "Engineer",
      }).success,
    ).toBe(true);
  });

  it("rejects weak registration passwords", () => {
    expect(
      registerSchema.safeParse({
        email: "developer@example.com",
        username: "queen_dev",
        password: "password",
      }).success,
    ).toBe(false);
  });

  it("requires a password for login", () => {
    expect(
      loginSchema.safeParse({
        email: "developer@example.com",
        password: "",
      }).success,
    ).toBe(false);
  });
});
