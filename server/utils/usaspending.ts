/**
 * @file USAspending adapter
 * @description Validated fetch boundary for public award search ingestion
 */

import { z } from "zod";

const USA_SPENDING_API_URL = "https://api.usaspending.gov/api/v2/search/spending_by_award/";

export const usaSpendingAwardSchema = z.object({
  "Award ID": z.string(),
  "Recipient Name": z.string(),
  "Start Date": z.string().nullable().optional(),
  "End Date": z.string().nullable().optional(),
  "Award Amount": z.coerce.number().default(0),
  "Awarding Agency": z.string().nullable().optional(),
  "Funding Agency": z.string().nullable().optional(),
  "Award Type": z.string().nullable().optional(),
  Description: z.string().nullable().optional(),
});

export const usaSpendingSearchResponseSchema = z.object({
  results: z.array(usaSpendingAwardSchema).default([]),
  page_metadata: z
    .object({
      page: z.number().optional(),
      hasNext: z.boolean().optional(),
      total: z.number().optional(),
    })
    .optional(),
});

export type UsaSpendingAward = z.infer<typeof usaSpendingAwardSchema>;

export interface UsaSpendingAwardSearchInput {
  recipientSearchText?: string[];
  keywords?: string[];
  fiscalYears?: number[];
  awardTypeCodes?: string[];
  limit?: number;
  page?: number;
}

export async function searchUsaSpendingAwards(
  input: UsaSpendingAwardSearchInput,
): Promise<UsaSpendingAward[]> {
  const response = await fetchWithRetry(USA_SPENDING_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      filters: {
        recipient_search_text: input.recipientSearchText ?? undefined,
        keywords: input.keywords ?? undefined,
        time_period: input.fiscalYears?.map((year) => ({
          start_date: `${year}-10-01`,
          end_date: `${year + 1}-09-30`,
        })),
        award_type_codes: input.awardTypeCodes ?? ["A", "B", "C", "D"],
      },
      fields: [
        "Award ID",
        "Recipient Name",
        "Start Date",
        "End Date",
        "Award Amount",
        "Awarding Agency",
        "Funding Agency",
        "Award Type",
        "Description",
      ],
      page: input.page ?? 1,
      limit: input.limit ?? 25,
      sort: "Award Amount",
      order: "desc",
    }),
  });

  const payload = await response.json();
  return usaSpendingSearchResponseSchema.parse(payload).results;
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  attempts = 3,
): Promise<Response> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, init);
      if (response.ok) return response;
      lastError = new Error(`USAspending returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 250));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("USAspending request failed");
}
