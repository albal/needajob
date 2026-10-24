import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";
import { emptyResponse, stubApi } from "./test-utils";

describe("App", () => {
  it("shows a no-jobs-yet state before the first Harvest", async () => {
    stubApi(() => emptyResponse());
    render(<App />);
    expect(await screen.findByText(/no jobs yet/i)).toBeInTheDocument();
  });
});
