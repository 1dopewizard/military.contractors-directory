/**
 * @file Contractor intelligence operations
 * @description Deterministic award/search aggregation used by public APIs and the explorer
 */

import { createHash } from "node:crypto";
import { z } from "zod";

const USA_SPENDING_BASE_URL = "https://www.usaspending.gov";

export const explorerIntentSchema = z.enum([
  "company_lookup",
  "company_comparison",
  "agency_top_contractors",
  "category_search",
  "location_search",
  "award_keyword_search",
  "unsupported",
]);

export const explorerPlanSchema = z.object({
  intent: explorerIntentSchema,
  contractors: z.array(z.string()).default([]),
  agency: z.string().nullable().default(null),
  naics: z.string().nullable().default(null),
  psc: z.string().nullable().default(null),
  location: z.string().nullable().default(null),
  keywords: z.array(z.string()).default([]),
  fiscalYears: z.array(z.number().int()).default([]),
  limit: z.number().int().min(1).max(25).default(10),
});

export type ExplorerPlan = z.infer<typeof explorerPlanSchema>;
export type ExplorerIntent = z.infer<typeof explorerIntentSchema>;

export interface ContractorContext {
  slug: string;
  name: string;
  aliases: string[];
  uei: string;
  cageCode: string;
  headquarters: string;
  specialties: string[];
  defenseRevenue: number;
  totalRevenue: number;
}

export interface IntelligenceAward {
  id: string;
  awardId: string;
  piid: string;
  contractorSlug: string;
  contractorName: string;
  agency: string;
  agencyCode: string;
  naicsCode: string;
  naicsTitle: string;
  pscCode: string;
  pscTitle: string;
  fiscalYear: number;
  obligation: number;
  description: string;
  placeOfPerformance: string;
  sourceUrl: string;
}

export interface IntelligenceBucket {
  key: string;
  label: string;
  obligation: number;
  awardCount: number;
}

export interface ContractorIntelligence {
  contractor: ContractorContext;
  summary: {
    totalObligations: number;
    awardCount: number;
    latestFiscalYear: number | null;
    topAgency: IntelligenceBucket | null;
    topNaics: IntelligenceBucket | null;
    topPsc: IntelligenceBucket | null;
  };
  aliases: string[];
  identifiers: {
    uei: string;
    cageCode: string;
  };
  recentAwards: IntelligenceAward[];
  yearlyTrend: IntelligenceBucket[];
  topAgencies: IntelligenceBucket[];
  topNaics: IntelligenceBucket[];
  topPsc: IntelligenceBucket[];
  sourceLinks: Array<{ label: string; url: string }>;
  sourceMetadata: SourceMetadata;
}

export interface SourceMetadata {
  sources: Array<{ name: string; url: string }>;
  generatedAt: string;
  freshness: string;
  structuredRecords: number;
}

export interface ExplorerResult {
  id: string;
  query: string;
  plan: ExplorerPlan;
  summary: string;
  resultType: ExplorerIntent;
  filtersUsed: Array<{ label: string; value: string }>;
  table: Array<Record<string, string | number | null>>;
  cards: Array<{ label: string; value: string; detail: string }>;
  chart: IntelligenceBucket[];
  sourceLinks: Array<{ label: string; url: string }>;
  sourceMetadata: SourceMetadata;
  cached: boolean;
}

const explorerMemoryCache = new Map<string, ExplorerResult>();

const contractorSeed: ContractorContext[] = [
  {
    slug: "lockheed-martin",
    name: "Lockheed Martin",
    aliases: ["Lockheed Martin Corporation", "LMT"],
    uei: "R74FKR7CTM65",
    cageCode: "04939",
    headquarters: "Bethesda, Maryland",
    specialties: ["Aerospace & Defense", "Space Systems", "Missiles"],
    defenseRevenue: 64.7,
    totalRevenue: 67.6,
  },
  {
    slug: "rtx",
    name: "RTX",
    aliases: ["RTX Corporation", "Raytheon Technologies", "Raytheon"],
    uei: "W1U3HBNH3Z38",
    cageCode: "05716",
    headquarters: "Arlington, Virginia",
    specialties: ["Missiles", "Sensors", "Aerospace & Defense"],
    defenseRevenue: 40.6,
    totalRevenue: 68.9,
  },
  {
    slug: "northrop-grumman",
    name: "Northrop Grumman",
    aliases: ["Northrop Grumman Corporation", "NOC"],
    uei: "YUYTCMKFK7H9",
    cageCode: "26512",
    headquarters: "Falls Church, Virginia",
    specialties: ["Space Systems", "C4ISR", "Aerospace & Defense"],
    defenseRevenue: 37.9,
    totalRevenue: 39.3,
  },
  {
    slug: "the-boeing-company",
    name: "Boeing",
    aliases: ["The Boeing Company", "Boeing Defense Space & Security"],
    uei: "J8HQD7LQK8Z7",
    cageCode: "81205",
    headquarters: "Arlington, Virginia",
    specialties: ["Aircraft", "Space Systems", "Sustainment"],
    defenseRevenue: 32.5,
    totalRevenue: 77.8,
  },
  {
    slug: "general-dynamics",
    name: "General Dynamics",
    aliases: ["General Dynamics Corporation", "GDIT"],
    uei: "L6TQHT5K8K77",
    cageCode: "04655",
    headquarters: "Reston, Virginia",
    specialties: ["Land Systems", "Shipbuilding", "IT Services"],
    defenseRevenue: 30.9,
    totalRevenue: 42.3,
  },
  {
    slug: "leidos",
    name: "Leidos",
    aliases: ["Leidos Holdings", "Leidos Inc."],
    uei: "MZLJLQ4F7J33",
    cageCode: "52334",
    headquarters: "Reston, Virginia",
    specialties: ["IT Services", "Intelligence", "Cybersecurity"],
    defenseRevenue: 8.9,
    totalRevenue: 15.4,
  },
  {
    slug: "booz-allen-hamilton",
    name: "Booz Allen Hamilton",
    aliases: ["Booz Allen", "BAH"],
    uei: "RWLCJQ9B7KZ7",
    cageCode: "17038",
    headquarters: "McLean, Virginia",
    specialties: ["Consulting", "Cybersecurity", "AI"],
    defenseRevenue: 6.5,
    totalRevenue: 10.7,
  },
  {
    slug: "caci-international",
    name: "CACI International",
    aliases: ["CACI", "CACI Inc."],
    uei: "FX3FJDKYK7V3",
    cageCode: "11063",
    headquarters: "Reston, Virginia",
    specialties: ["Intelligence", "IT Services", "Cybersecurity"],
    defenseRevenue: 5.2,
    totalRevenue: 7.7,
  },
  {
    slug: "anduril",
    name: "Anduril",
    aliases: ["Anduril Industries", "Anduril Industries Inc."],
    uei: "P8KXN8LDYMM7",
    cageCode: "8LAH1",
    headquarters: "Costa Mesa, California",
    specialties: ["Autonomous Systems", "Counter-UAS", "AI"],
    defenseRevenue: 1.1,
    totalRevenue: 1.4,
  },
  {
    slug: "palantir-technologies",
    name: "Palantir",
    aliases: ["Palantir Technologies", "Palantir USG"],
    uei: "KPLWSC7F1EE3",
    cageCode: "4SWQ3",
    headquarters: "Denver, Colorado",
    specialties: ["Data Platforms", "AI", "Intelligence"],
    defenseRevenue: 1.3,
    totalRevenue: 2.2,
  },
];

const awardsSeed: IntelligenceAward[] = [
  awardSeed("LMT-2026-001", "W58RGZ26C0001", "lockheed-martin", "Department of Defense", "097", "336414", "Guided Missile and Space Vehicle Manufacturing", "1410", "Guided missiles", 2026, 5240000000, "F-35 modernization, sustainment, and mission systems support.", "Texas, United States"),
  awardSeed("LMT-2025-002", "FA881825C0002", "lockheed-martin", "Department of the Air Force", "057", "336414", "Guided Missile and Space Vehicle Manufacturing", "1420", "Rockets and space vehicles", 2025, 3180000000, "Space-based missile warning and command architecture engineering.", "Colorado, United States"),
  awardSeed("RTX-2026-001", "N0001926C0003", "rtx", "Department of the Navy", "017", "334511", "Search, Detection, Navigation, Guidance Systems", "5840", "Radar equipment", 2026, 2860000000, "Air and missile defense radar production and integration.", "Massachusetts, United States"),
  awardSeed("RTX-2025-002", "W31P4Q25C0004", "rtx", "Department of the Army", "021", "336414", "Guided Missile and Space Vehicle Manufacturing", "1410", "Guided missiles", 2025, 2440000000, "Patriot and precision missile production support.", "Arizona, United States"),
  awardSeed("NOC-2026-001", "FA865026C0005", "northrop-grumman", "Department of the Air Force", "057", "336414", "Guided Missile and Space Vehicle Manufacturing", "1420", "Rockets and space vehicles", 2026, 3920000000, "Sentinel strategic deterrent engineering and manufacturing development.", "Utah, United States"),
  awardSeed("NOC-2025-002", "N0002425C0006", "northrop-grumman", "Department of the Navy", "017", "334511", "Search, Detection, Navigation, Guidance Systems", "AC13", "R&D: aircraft", 2025, 1760000000, "Carrier aviation mission systems and ISR payload integration.", "California, United States"),
  awardSeed("BA-2026-001", "FA863426C0007", "the-boeing-company", "Department of the Air Force", "057", "336411", "Aircraft Manufacturing", "1510", "Aircraft, fixed wing", 2026, 3360000000, "Tanker, trainer, and tactical aircraft production support.", "Missouri, United States"),
  awardSeed("BA-2025-002", "N0001925C0008", "the-boeing-company", "Department of the Navy", "017", "336411", "Aircraft Manufacturing", "J015", "Maintenance of aircraft", 2025, 1420000000, "Naval aircraft sustainment and modification services.", "Washington, United States"),
  awardSeed("GD-2026-001", "N0002426C0009", "general-dynamics", "Department of the Navy", "017", "336611", "Ship Building and Repairing", "1905", "Combat ships and landing vessels", 2026, 4840000000, "Submarine construction, combat systems integration, and shipyard support.", "Connecticut, United States"),
  awardSeed("GD-2025-002", "W56HZV25C0010", "general-dynamics", "Department of the Army", "021", "336992", "Military Armored Vehicle Manufacturing", "2355", "Combat vehicles", 2025, 1640000000, "Armored vehicle production and modernization.", "Michigan, United States"),
  awardSeed("LDOS-2026-001", "HC102826C0011", "leidos", "Defense Information Systems Agency", "097", "541512", "Computer Systems Design Services", "D399", "IT and telecom services", 2026, 1180000000, "Enterprise IT modernization, cloud migration, and cybersecurity operations.", "Virginia, United States"),
  awardSeed("LDOS-2025-002", "W911QX25C0012", "leidos", "Department of the Army", "021", "541715", "R&D in Nanotechnology", "AJ12", "R&D: sciences", 2025, 740000000, "Sensor analytics and mission software research support.", "Maryland, United States"),
  awardSeed("BAH-2026-001", "FA701426F0013", "booz-allen-hamilton", "Department of the Air Force", "057", "541611", "Administrative Management Consulting Services", "R408", "Program management support", 2026, 860000000, "Digital transformation, AI adoption, and enterprise advisory services.", "Virginia, United States"),
  awardSeed("BAH-2025-002", "N6523625F0014", "booz-allen-hamilton", "Department of the Navy", "017", "541512", "Computer Systems Design Services", "D399", "IT and telecom services", 2025, 620000000, "Cybersecurity engineering and mission platform support.", "South Carolina, United States"),
  awardSeed("CACI-2026-001", "HHM40226F0015", "caci-international", "Defense Intelligence Agency", "097", "541512", "Computer Systems Design Services", "R425", "Engineering and technical services", 2026, 980000000, "Intelligence analysis systems, secure networks, and mission operations support.", "Virginia, United States"),
  awardSeed("CACI-2025-002", "W15P7T25F0016", "caci-international", "Department of the Army", "021", "541519", "Other Computer Related Services", "D399", "IT and telecom services", 2025, 510000000, "Tactical communications software and cyber operations support.", "Maryland, United States"),
  awardSeed("AND-2026-001", "FA875026C0017", "anduril", "Department of the Air Force", "057", "541715", "R&D in Nanotechnology", "AC12", "R&D: defense systems", 2026, 420000000, "Autonomous surveillance, counter-UAS, and AI-enabled command systems.", "California, United States"),
  awardSeed("AND-2025-002", "W9124P25C0018", "anduril", "Department of the Army", "021", "334511", "Search, Detection, Navigation, Guidance Systems", "5840", "Radar equipment", 2025, 260000000, "Counter-intrusion sensor systems and autonomous perimeter defense.", "California, United States"),
  awardSeed("PLTR-2026-001", "W52P1J26F0019", "palantir-technologies", "Department of the Army", "021", "541512", "Computer Systems Design Services", "D318", "Integrated hardware/software systems", 2026, 640000000, "AI-enabled data platform support for operational planning and logistics.", "District of Columbia, United States"),
  awardSeed("PLTR-2025-002", "FA701425F0020", "palantir-technologies", "Department of the Air Force", "057", "541511", "Custom Computer Programming Services", "D399", "IT and telecom services", 2025, 390000000, "Mission data integration, analytics, and software delivery.", "Colorado, United States"),
];

function awardSeed(
  id: string,
  piid: string,
  contractorSlug: string,
  agency: string,
  agencyCode: string,
  naicsCode: string,
  naicsTitle: string,
  pscCode: string,
  pscTitle: string,
  fiscalYear: number,
  obligation: number,
  description: string,
  placeOfPerformance: string,
): IntelligenceAward {
  const contractor = contractorSeed.find((item) => item.slug === contractorSlug);
  if (!contractor) {
    throw new Error(`Missing seeded contractor for ${contractorSlug}`);
  }

  return {
    id,
    awardId: id,
    piid,
    contractorSlug,
    contractorName: contractor.name,
    agency,
    agencyCode,
    naicsCode,
    naicsTitle,
    pscCode,
    pscTitle,
    fiscalYear,
    obligation,
    description,
    placeOfPerformance,
    sourceUrl: `${USA_SPENDING_BASE_URL}/award/${encodeURIComponent(piid)}`,
  };
}

export function createQueryHash(query: string): string {
  return createHash("sha256").update(query.trim().toLowerCase()).digest("hex");
}

export function getExplorerMemoryCache(id: string): ExplorerResult | null {
  return explorerMemoryCache.get(id) ?? null;
}

export function setExplorerMemoryCache(result: ExplorerResult): void {
  explorerMemoryCache.set(result.id, result);
}

export function formatMoney(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
}

export function getSeedContractors(): ContractorContext[] {
  return contractorSeed;
}

export function searchAwards(plan: ExplorerPlan): IntelligenceAward[] {
  let awards = [...awardsSeed];

  if (plan.contractors.length) {
    const contractorMatches = plan.contractors.map(normalizeText);
    awards = awards.filter((award) =>
      contractorMatches.some(
        (match) =>
          normalizeText(award.contractorSlug).includes(match) ||
          normalizeText(award.contractorName).includes(match),
      ),
    );
  }

  if (plan.agency) {
    const agency = normalizeText(plan.agency);
    awards = awards.filter((award) => normalizeText(award.agency).includes(agency));
  }

  if (plan.naics) {
    const naics = normalizeText(plan.naics);
    awards = awards.filter(
      (award) =>
        award.naicsCode === plan.naics ||
        normalizeText(award.naicsTitle).includes(naics),
    );
  }

  if (plan.psc) {
    const psc = normalizeText(plan.psc);
    awards = awards.filter(
      (award) =>
        award.pscCode === plan.psc || normalizeText(award.pscTitle).includes(psc),
    );
  }

  if (plan.location) {
    const location = normalizeText(plan.location);
    awards = awards.filter((award) =>
      normalizeText(award.placeOfPerformance).includes(location),
    );
  }

  if (plan.keywords.length) {
    const keywords = plan.keywords.map(normalizeText);
    awards = awards.filter((award) => {
      const haystack = normalizeText(
        `${award.description} ${award.naicsTitle} ${award.pscTitle} ${award.agency}`,
      );
      return keywords.every((keyword) => haystack.includes(keyword));
    });
  }

  if (plan.fiscalYears.length) {
    awards = awards.filter((award) => plan.fiscalYears.includes(award.fiscalYear));
  }

  return awards.sort((a, b) => b.obligation - a.obligation);
}

export function getContractorIntelligence(slug: string): ContractorIntelligence | null {
  const contractor = contractorSeed.find(
    (item) => item.slug === slug || normalizeText(item.name) === normalizeText(slug),
  );

  if (!contractor) return null;

  const awards = awardsSeed.filter((award) => award.contractorSlug === contractor.slug);
  return buildContractorIntelligence(contractor, awards);
}

export function getTopContractorsByAgency(agencyName: string, limit = 10) {
  const awards = searchAwards({
    ...defaultPlan(),
    intent: "agency_top_contractors",
    agency: agencyName,
    limit,
  });
  return aggregateBy(awards, "contractorSlug", (award) => award.contractorName).slice(
    0,
    limit,
  );
}

export function getTopContractorsByNaics(naics: string, limit = 10) {
  const awards = searchAwards({
    ...defaultPlan(),
    intent: "category_search",
    naics,
    limit,
  });
  return aggregateBy(awards, "contractorSlug", (award) => award.contractorName).slice(
    0,
    limit,
  );
}

export function getTopContractorsByPsc(psc: string, limit = 10) {
  const awards = searchAwards({
    ...defaultPlan(),
    intent: "category_search",
    psc,
    limit,
  });
  return aggregateBy(awards, "contractorSlug", (award) => award.contractorName).slice(
    0,
    limit,
  );
}

export function compareContractors(slugs: string[]): ContractorIntelligence[] {
  return slugs
    .map((slug) => getContractorIntelligence(slug))
    .filter((item): item is ContractorIntelligence => Boolean(item));
}

export function getSpendingTrend(awards: IntelligenceAward[]): IntelligenceBucket[] {
  return aggregateBy(awards, "fiscalYear", (award) => `FY${award.fiscalYear}`).sort(
    (a, b) => Number(a.key) - Number(b.key),
  );
}

export function planExplorerQuery(query: string): ExplorerPlan {
  const normalized = normalizeText(query);
  const contractors = contractorSeed
    .filter((contractor) =>
      [contractor.slug, contractor.name, ...contractor.aliases].some((name) =>
        normalized.includes(normalizeText(name)),
      ),
    )
    .map((contractor) => contractor.slug);

  const fiscalYears = Array.from(query.matchAll(/\b20\d{2}\b/g)).map((match) =>
    Number(match[0]),
  );
  const agency = extractAgency(normalized);
  const location = extractLocation(normalized);
  const naics = extractCode(query, "naics");
  const psc = extractCode(query, "psc");
  const keywords = extractKeywords(normalized);

  let intent: ExplorerIntent = "award_keyword_search";
  if (contractors.length === 1 && /profile|lookup|summary|show|tell/.test(normalized)) {
    intent = "company_lookup";
  } else if (contractors.length > 1 || /compare|versus| vs /.test(normalized)) {
    intent = "company_comparison";
  } else if (/top|largest|rank|biggest/.test(normalized) && agency) {
    intent = "agency_top_contractors";
  } else if (naics || psc || /category|naics|psc/.test(normalized)) {
    intent = "category_search";
  } else if (location) {
    intent = "location_search";
  } else if (!query.trim()) {
    intent = "unsupported";
  }

  if (intent === "award_keyword_search" && !keywords.length && !contractors.length) {
    intent = "unsupported";
  }

  return explorerPlanSchema.parse({
    intent,
    contractors,
    agency,
    naics,
    psc,
    location,
    keywords,
    fiscalYears,
    limit: 10,
  });
}

export function runExplorerQuery(query: string): ExplorerResult {
  const id = createQueryHash(query).slice(0, 16);
  const plan = planExplorerQuery(query);

  if (plan.intent === "unsupported") {
    return {
      id,
      query,
      plan,
      summary:
        "Try asking about a contractor, agency, location, NAICS/PSC category, or award keyword so the explorer can use structured award data.",
      resultType: plan.intent,
      filtersUsed: [],
      table: [],
      cards: [],
      chart: [],
      sourceLinks: sourceLinks([]),
      sourceMetadata: metadata([]),
      cached: false,
    };
  }

  const awards = searchAwards(plan).slice(0, plan.limit);
  const allMatchedAwards = searchAwards(plan);
  const contractors = aggregateBy(
    allMatchedAwards,
    "contractorSlug",
    (award) => award.contractorName,
  ).slice(0, plan.limit);
  const totalObligations = allMatchedAwards.reduce(
    (sum, award) => sum + award.obligation,
    0,
  );

  const table =
    plan.intent === "company_comparison" ||
    plan.intent === "agency_top_contractors" ||
    plan.intent === "category_search"
      ? contractors.map((item, index) => ({
          rank: index + 1,
          contractor: item.label,
          obligations: item.obligation,
          awards: item.awardCount,
        }))
      : awards.map((award) => ({
          contractor: award.contractorName,
          agency: award.agency,
          fiscalYear: award.fiscalYear,
          obligations: award.obligation,
          category: `${award.naicsCode} / ${award.pscCode}`,
          description: award.description,
        }));

  const filtersUsed = [
    ...plan.contractors.map((slug) => ({
      label: "Contractor",
      value: contractorSeed.find((contractor) => contractor.slug === slug)?.name ?? slug,
    })),
    plan.agency ? { label: "Agency", value: plan.agency } : null,
    plan.naics ? { label: "NAICS", value: plan.naics } : null,
    plan.psc ? { label: "PSC", value: plan.psc } : null,
    plan.location ? { label: "Location", value: plan.location } : null,
    ...plan.keywords.map((keyword) => ({ label: "Keyword", value: keyword })),
    ...plan.fiscalYears.map((year) => ({ label: "Fiscal year", value: String(year) })),
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return {
    id,
    query,
    plan,
    summary: summarizeExplorerResult(plan, allMatchedAwards, totalObligations),
    resultType: plan.intent,
    filtersUsed,
    table,
    cards: [
      {
        label: "Matched awards",
        value: String(allMatchedAwards.length),
        detail: "Structured public award records",
      },
      {
        label: "Obligations",
        value: formatMoney(totalObligations),
        detail: "Sum of matched award obligations",
      },
      {
        label: "Top contractor",
        value: contractors[0]?.label ?? "N/A",
        detail: contractors[0] ? formatMoney(contractors[0].obligation) : "No match",
      },
    ],
    chart: getSpendingTrend(allMatchedAwards),
    sourceLinks: sourceLinks(awards),
    sourceMetadata: metadata(allMatchedAwards),
    cached: false,
  };
}

function buildContractorIntelligence(
  contractor: ContractorContext,
  awards: IntelligenceAward[],
): ContractorIntelligence {
  const topAgencies = aggregateBy(awards, "agency", (award) => award.agency);
  const topNaics = aggregateBy(awards, "naicsCode", (award) => award.naicsTitle);
  const topPsc = aggregateBy(awards, "pscCode", (award) => award.pscTitle);

  return {
    contractor,
    summary: {
      totalObligations: awards.reduce((sum, award) => sum + award.obligation, 0),
      awardCount: awards.length,
      latestFiscalYear: awards.length
        ? Math.max(...awards.map((award) => award.fiscalYear))
        : null,
      topAgency: topAgencies[0] ?? null,
      topNaics: topNaics[0] ?? null,
      topPsc: topPsc[0] ?? null,
    },
    aliases: contractor.aliases,
    identifiers: {
      uei: contractor.uei,
      cageCode: contractor.cageCode,
    },
    recentAwards: awards
      .sort((a, b) => b.fiscalYear - a.fiscalYear || b.obligation - a.obligation)
      .slice(0, 8),
    yearlyTrend: getSpendingTrend(awards),
    topAgencies,
    topNaics,
    topPsc,
    sourceLinks: sourceLinks(awards),
    sourceMetadata: metadata(awards),
  };
}

function aggregateBy<T extends keyof IntelligenceAward>(
  awards: IntelligenceAward[],
  key: T,
  labelFor: (award: IntelligenceAward) => string,
): IntelligenceBucket[] {
  const buckets = new Map<string, IntelligenceBucket>();

  for (const award of awards) {
    const bucketKey = String(award[key]);
    const existing = buckets.get(bucketKey);
    if (existing) {
      existing.obligation += award.obligation;
      existing.awardCount += 1;
    } else {
      buckets.set(bucketKey, {
        key: bucketKey,
        label: labelFor(award),
        obligation: award.obligation,
        awardCount: 1,
      });
    }
  }

  return [...buckets.values()].sort((a, b) => b.obligation - a.obligation);
}

function summarizeExplorerResult(
  plan: ExplorerPlan,
  awards: IntelligenceAward[],
  totalObligations: number,
): string {
  if (!awards.length) {
    return "No structured award records matched the filters. Refine the contractor, agency, category, location, or keyword.";
  }

  const topContractor = aggregateBy(
    awards,
    "contractorSlug",
    (award) => award.contractorName,
  )[0];
  const topAgency = aggregateBy(awards, "agency", (award) => award.agency)[0];

  if (plan.intent === "company_lookup" && plan.contractors[0]) {
    const contractor = contractorSeed.find(
      (item) => item.slug === plan.contractors[0],
    );
    return `${contractor?.name ?? "This contractor"} has ${formatMoney(
      totalObligations,
    )} in matched public obligations across ${awards.length} seeded award records. The largest agency concentration is ${topAgency?.label ?? "not available"}.`;
  }

  return `${topContractor?.label ?? "The top contractor"} leads the matched set with ${formatMoney(
    topContractor?.obligation ?? 0,
  )}. The query matched ${awards.length} award records totaling ${formatMoney(
    totalObligations,
  )}, with ${topAgency?.label ?? "public agencies"} as the largest agency bucket.`;
}

function sourceLinks(awards: IntelligenceAward[]) {
  const links = awards.slice(0, 5).map((award) => ({
    label: `${award.contractorName} ${award.piid}`,
    url: award.sourceUrl,
  }));

  return [
    {
      label: "USAspending award search",
      url: `${USA_SPENDING_BASE_URL}/search`,
    },
    ...links,
  ];
}

function metadata(awards: IntelligenceAward[]): SourceMetadata {
  return {
    sources: [
      {
        name: "USAspending.gov",
        url: USA_SPENDING_BASE_URL,
      },
    ],
    generatedAt: new Date().toISOString(),
    freshness:
      "Seeded MVP records modeled after USAspending fields. Replace with live ingestion before production decisions.",
    structuredRecords: awards.length,
  };
}

function extractAgency(normalized: string): string | null {
  const agencies = [
    "department of defense",
    "department of the air force",
    "department of the navy",
    "department of the army",
    "defense information systems agency",
    "defense intelligence agency",
  ];

  return agencies.find((agency) => normalized.includes(agency)) ?? null;
}

function extractLocation(normalized: string): string | null {
  const locations = [
    "virginia",
    "maryland",
    "california",
    "texas",
    "colorado",
    "arizona",
    "connecticut",
    "district of columbia",
    "massachusetts",
    "utah",
  ];

  return locations.find((location) => normalized.includes(location)) ?? null;
}

function extractCode(query: string, label: "naics" | "psc"): string | null {
  const regex = label === "naics" ? /naics\s+(\d{6})/i : /psc\s+([a-z0-9]{4})/i;
  return query.match(regex)?.[1]?.toUpperCase() ?? null;
}

function extractKeywords(normalized: string): string[] {
  const keywords = [
    "missile",
    "radar",
    "cyber",
    "ai",
    "ship",
    "aircraft",
    "space",
    "intelligence",
    "autonomous",
    "software",
    "cloud",
    "sustainment",
  ];

  return keywords.filter((keyword) => normalized.includes(keyword));
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function defaultPlan(): ExplorerPlan {
  return {
    intent: "award_keyword_search",
    contractors: [],
    agency: null,
    naics: null,
    psc: null,
    location: null,
    keywords: [],
    fiscalYears: [],
    limit: 10,
  };
}
