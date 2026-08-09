import { ssrApiClient } from "../api";

global.fetch = jest.fn();

describe("SSR people API methods", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches ordered team groups without a stale cache window", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    await ssrApiClient.getPeople();

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/people/",
      expect.objectContaining({
        cache: "no-store",
      })
    );
    expect((fetch as jest.Mock).mock.calls[0][1]).not.toHaveProperty("next");
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
        cache: "no-store",
      })
    );
    expect((fetch as jest.Mock).mock.calls[0][1]).not.toHaveProperty("next");
  });

  it("fetches team content blocks without a stale cache window", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    await ssrApiClient.getTeamContentBlocks();

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/content-blocks/?page_type=team",
      expect.objectContaining({
        cache: "no-store",
      })
    );
    expect((fetch as jest.Mock).mock.calls[0][1]).not.toHaveProperty("next");
  });

  it("keeps revalidation caching for unrelated public content", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    await ssrApiClient.getCampaigns();

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/campaigns/",
      expect.objectContaining({ next: { revalidate: 300 } })
    );
    expect((fetch as jest.Mock).mock.calls[0][1]).not.toHaveProperty("cache");
  });
});
