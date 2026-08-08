import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import AddressAutocomplete from "../AddressAutocomplete";

describe("AddressAutocomplete", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it("requests suggestions from the trailing-slash API route", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ suggestions: [] }),
    } as Response);

    render(
      <AddressAutocomplete onAddressSelect={jest.fn()} debounceDelay={0} />
    );

    fireEvent.change(screen.getByTestId("address-autocomplete"), {
      target: { value: "100 Main" },
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/address/suggestions/?q=100%20Main&limit=5"
      );
    });
  });

  it("requests place details from the trailing-slash API route", async () => {
    const onAddressSelect = jest.fn();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          suggestions: [{ text: "100 Main St", place_id: "place-123" }],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          street_address: "100 Main St",
          city: "Baltimore",
          state: "MD",
          zip_code: "21201",
        }),
      } as Response);

    render(
      <AddressAutocomplete
        onAddressSelect={onAddressSelect}
        debounceDelay={0}
      />
    );

    fireEvent.change(screen.getByTestId("address-autocomplete"), {
      target: { value: "100 Main" },
    });
    await waitFor(() => {
      expect(screen.getByTestId("suggestion-0")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("suggestion-0"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        "/api/address/place/place-123/"
      );
      expect(onAddressSelect).toHaveBeenCalledWith({
        street_address: "100 Main St",
        city: "Baltimore",
        state: "MD",
        zip_code: "21201",
      });
    });
  });
});
