import { formatStakeholderLocation } from "./EndorsementsList";

describe("formatStakeholderLocation", () => {
  it("omits the separator when state is absent", () => {
    expect(formatStakeholderLocation("Baltimore", null)).toBe("Baltimore");
  });

  it("joins a city and state abbreviation", () => {
    expect(formatStakeholderLocation("Baltimore", "MD")).toBe("Baltimore, MD");
  });
});
