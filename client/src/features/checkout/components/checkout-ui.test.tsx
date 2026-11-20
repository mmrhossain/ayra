import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import { CheckoutSelect } from "./checkout-ui";

it("closes checkout options after selection and reselection without locking page scroll", async () => {
  const environment = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previous = environment.IS_REACT_ACT_ENVIRONMENT;
  environment.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  function CheckoutFields() {
    const [district, setDistrict] = useState<string>();
    return (
      <>
        <nav aria-label="Store navigation" />
        <CheckoutSelect
          label="District"
          placeholder="Select district"
          {...(district !== undefined && { value: district })}
          onValueChange={setDistrict}
          options={[{ value: "dhaka", label: "Dhaka" }]}
        />
        <button type="button" onClick={() => setDistrict(undefined)}>Reset</button>
      </>
    );
  }

  try {
    await act(async () => root.render(<CheckoutFields />));
    const trigger = container.querySelector("button[aria-expanded]")!;
    const option = container.querySelector('input[type="radio"]')!;
    expect(trigger.textContent).toContain("Select district");
    await act(async () => (trigger as HTMLButtonElement).click());
    await act(async () => (option as HTMLInputElement).click());
    expect((option as HTMLInputElement).checked).toBe(true);
    expect(trigger.textContent).toContain("Dhaka");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
    expect(document.body.hasAttribute("data-scroll-locked")).toBe(false);
    expect(container.querySelector("nav")?.closest('[aria-hidden="true"]')).toBeNull();
    await act(async () => (trigger as HTMLButtonElement).click());
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    await act(async () => (option as HTMLInputElement).click());
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
    await act(async () => container.querySelectorAll("button")[1]!.click());
    expect(trigger.textContent).toContain("Select district");
  } finally {
    await act(async () => root.unmount());
    container.remove();
    if (previous === undefined) delete environment.IS_REACT_ACT_ENVIRONMENT;
    else environment.IS_REACT_ACT_ENVIRONMENT = previous;
  }
});
