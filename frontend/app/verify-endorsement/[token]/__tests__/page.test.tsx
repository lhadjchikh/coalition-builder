import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import API from "../../../../services/api";
import VerifyEndorsementPage from "../page";

jest.mock("../../../../services/api", () => ({
  __esModule: true,
  default: {
    verifyEndorsement: jest.fn(),
  },
}));

describe("VerifyEndorsementPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("verifies the token and confirms the endorsement is under review", async () => {
    (API.verifyEndorsement as jest.Mock).mockResolvedValue({
      success: true,
      message:
        "Email verified successfully! Your endorsement is now under review.",
      status: "verified",
    });

    render(
      <VerifyEndorsementPage
        params={Promise.resolve({ token: "verification-token" })}
      />
    );

    expect(screen.getByText("Verifying your endorsement…")).toBeInTheDocument();
    await waitFor(() => {
      expect(API.verifyEndorsement).toHaveBeenCalledWith("verification-token");
    });
    expect(
      await screen.findByRole("heading", { name: "Endorsement verified" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return home" })).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("shows a useful error when verification fails", async () => {
    (API.verifyEndorsement as jest.Mock).mockRejectedValue(
      new Error("HTTP error! status: 404")
    );

    render(
      <VerifyEndorsementPage
        params={Promise.resolve({ token: "missing-token" })}
      />
    );

    expect(
      await screen.findByRole("heading", { name: "Verification failed" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "This verification link is invalid or has expired. Please submit your endorsement again."
      )
    ).toBeInTheDocument();
  });
});
