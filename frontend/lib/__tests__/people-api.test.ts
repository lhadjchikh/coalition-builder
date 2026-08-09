import { ssrApiClient } from "../api";

global.fetch = jest.fn();

describe("SSR people API methods", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches ordered team groups with the shared revalidation window", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    await ssrApiClient.getPeople();

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/people/",
      expect.objectContaining({
        next: { revalidate: 300 },
      })
    );
  });

  it("fetches one profile by its encoded slug", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1 }),
    });

    await ssrApiClient.getPerson("josé doe");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/people/jos%C3%A9%20doe/",
      expect.objectContaining({
        next: { revalidate: 300 },
      })
    );
  });
});
