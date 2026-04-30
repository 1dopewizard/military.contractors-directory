/**
 * @file Daily contractor snapshot task
 * @description Refreshes trailing 36-month DoD recipient aggregates from USAspending
 */

import { refreshContractorSnapshot } from "@/server/utils/contractor-snapshot";

export default defineTask({
  meta: {
    name: "contractor-snapshot-refresh",
    description:
      "Refresh trailing 36-month DoD-awarded USAspending recipient snapshot.",
  },
  async run() {
    const result = await refreshContractorSnapshot();
    return { result };
  },
});
