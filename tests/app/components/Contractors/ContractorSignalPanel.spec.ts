/**
 * @file ContractorSignalPanel tests
 * @description Verifies public-data signal rendering states
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import ContractorSignalPanel from "@/app/components/Contractors/ContractorSignalPanel.vue";
import type { ContractorSignal } from "@/app/types/intelligence.types";

const baseSignal: ContractorSignal = {
  key: "agency-concentration",
  label: "Agency concentration",
  status: "healthy",
  value: "40%",
  explanation: "Department of the Navy represents 40% of observed obligations.",
  calculationWindow: "FY2024-FY2026",
  inputs: ["total obligations: 100"],
  sourceFields: ["awardingAgency", "obligation"],
  sourceLinks: [{ label: "USAspending", url: "https://www.usaspending.gov" }],
  confidence: "medium",
  caveats: ["Not a performance grade."],
};

function mountPanel(signals: ContractorSignal[], warnings: string[] = []) {
  return mount(ContractorSignalPanel, {
    props: { signals, warnings },
    global: {
      stubs: {
        NuxtLink: {
          props: ["to"],
          template: '<a :href="to"><slot /></a>',
        },
        Icon: true,
      },
    },
  });
}

describe("ContractorSignalPanel", () => {
  it("renders available signals with labels, statuses, and explanations", () => {
    const wrapper = mountPanel([baseSignal]);

    expect(wrapper.text()).toContain("Transparent public-data signals");
    expect(wrapper.text()).toContain("Agency concentration");
    expect(wrapper.text()).toContain("Healthy");
    expect(wrapper.text()).toContain("40%");
    expect(wrapper.text()).toContain("Not a performance grade.");
    expect(wrapper.find('a[href="https://www.usaspending.gov"]').exists()).toBe(
      true,
    );
  });

  it("renders unavailable signals as neutral data coverage states", () => {
    const wrapper = mountPanel([
      {
        ...baseSignal,
        key: "naics-concentration",
        label: "NAICS concentration",
        status: "unavailable",
        value: null,
        explanation: "Required public-data inputs are missing.",
        caveats: ["Unavailable is not a negative judgment."],
      },
    ]);

    expect(wrapper.text()).toContain("NAICS concentration");
    expect(wrapper.text()).toContain("Unavailable");
    expect(wrapper.text()).toContain(
      "Required public-data inputs are missing.",
    );
  });

  it("shows source warnings without turning them into definitive judgments", () => {
    const wrapper = mountPanel(
      [baseSignal],
      ["Cached data is older than the refresh window."],
    );

    expect(wrapper.text()).toContain("Source warnings");
    expect(wrapper.text()).toContain(
      "Cached data is older than the refresh window.",
    );
    expect(wrapper.text()).toContain("They are not grades");
  });
});
