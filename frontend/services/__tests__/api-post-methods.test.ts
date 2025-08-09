import API from "../api";
import { EndorsementCreate } from "../../types/index";
import {
  expectHeaders,
  createMockResponse,
  getExpectedUrl,
  createCleanEnv,
} from "./api-test-helpers";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock document.cookie for CSRF tests
Object.defineProperty(document, "cookie", {
  writable: true,
  value: "",
});

describe("API Service - POST/PATCH Methods", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.replaceProperty(process, "env", createCleanEnv(originalEnv));
    delete (global as any).window;
    document.cookie = "";
  });

  afterAll(() => {
    jest.replaceProperty(process, "env", originalEnv);
  });

  describe("createEndorsement", () => {
    const mockEndorsementData: EndorsementCreate = {
      campaign_id: 1,
      stakeholder: {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        street_address: "123 Main St",
        city: "Anytown",
        state: "CA",
        zip_code: "12345",
        type: "individual",
      },
      statement: "I support this campaign",
      public_display: true,
      terms_accepted: true,
      org_authorized: false,
    };

    const mockResponse = {
      id: 1,
      ...mockEndorsementData,
      created_at: "2023-01-01T00:00:00Z",
    };

    it("should create endorsement successfully", async () => {
      // Mock CSRF token fetch and actual POST request
      mockFetch
        .mockResolvedValueOnce(createMockResponse({ csrf_token: "test-token" })) // CSRF token fetch
        .mockResolvedValueOnce(createMockResponse(mockResponse)); // Actual POST

      const result = await API.createEndorsement(mockEndorsementData);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        getExpectedUrl("/api/endorsements/", originalEnv),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(mockEndorsementData),
          credentials: "same-origin",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          signal: expect.any(AbortSignal),
        })
      );
    });
  });

  describe("patch method", () => {
    it("should support PATCH requests", async () => {
      const mockData = { id: 1, name: "Updated" };
      // Set cookie to avoid CSRF token fetch
      document.cookie = "csrftoken=patch-token";
      mockFetch.mockResolvedValueOnce(createMockResponse(mockData));

      const result = await API.patch("/api/test/1/", { name: "Updated" });

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        getExpectedUrl("/api/test/1/", originalEnv),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ name: "Updated" }),
          credentials: "same-origin",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          signal: expect.any(AbortSignal),
        })
      );
    });

    it("should handle PATCH errors", async () => {
      // Set cookie to avoid CSRF token fetch
      document.cookie = "csrftoken=patch-token";
      mockFetch.mockResolvedValueOnce(
        createMockResponse(null, { ok: false, status: 403 })
      );

      await expect(
        API.patch("/api/test/1/", { name: "Updated" })
      ).rejects.toThrow("HTTP error! status: 403");
    });
  });
});
