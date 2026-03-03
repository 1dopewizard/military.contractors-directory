/**
 * @file useJobs composable tests
 * @description Tests for the job fetching and formatting composable
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { ref } from "vue";

// Create mocks
const mockConvex = {
  query: vi.fn(),
  mutation: vi.fn(),
};

const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Stub globals BEFORE importing the composable
// This makes the auto-imported functions available globally
vi.stubGlobal("useConvex", () => mockConvex);
vi.stubGlobal("useLogger", () => mockLogger);

// Mock the Convex API module
vi.mock("@/convex/_generated/api", () => ({
  api: {
    jobs: {
      list: "jobs:list",
      getById: "jobs:getById",
      getBySlug: "jobs:getBySlug",
      getFeatured: "jobs:getFeatured",
    },
  },
}));

// Import after stubs are set up
import { useJobs } from "~/app/composables/useJobs";

// Mock job fixture
const mockJob = {
  _id: "job-123",
  _creationTime: Date.now(),
  title: "Network Security Engineer",
  company: "Defense Corp",
  companyId: "company-123",
  location: "Washington, DC",
  locationType: "CONUS",
  description: "Network security position requiring TS/SCI clearance.",
  snippet: "Network security position...",
  requirements: ["CISSP", "Network+", "5+ years experience"],
  clearanceRequired: "TS/SCI",
  salaryMin: 120000,
  salaryMax: 180000,
  currency: "USD",
  featured: false,
  status: "ACTIVE",
  isActive: true,
  isOconus: false,
  postedAt: Date.now() - 86400000,
  createdAt: Date.now() - 86400000,
  updatedAt: Date.now(),
};

describe("useJobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("formatSalary", () => {
    it("formats salary range correctly", () => {
      const { formatSalary } = useJobs();

      const result = formatSalary(80000, 120000, "USD");

      expect(result).toBe("$80K - $120K USD");
    });

    it("formats minimum salary only", () => {
      const { formatSalary } = useJobs();

      const result = formatSalary(100000, null, "USD");

      expect(result).toBe("$100K+ USD");
    });

    it("formats maximum salary only", () => {
      const { formatSalary } = useJobs();

      const result = formatSalary(null, 150000, "USD");

      expect(result).toBe("Up to $150K USD");
    });

    it('returns "Not specified" when no salary data', () => {
      const { formatSalary } = useJobs();

      const result = formatSalary(null, null, "USD");

      expect(result).toBe("Not specified");
    });
  });

  describe("formatDate", () => {
    it('returns "Today" for current date', () => {
      const { formatDate } = useJobs();

      const result = formatDate(Date.now());

      expect(result).toBe("Today");
    });

    it('returns "Yesterday" for yesterday', () => {
      const { formatDate } = useJobs();
      const yesterday = Date.now() - 86400000; // 24 hours ago

      const result = formatDate(yesterday);

      expect(result).toBe("Yesterday");
    });

    it("returns days ago for recent dates", () => {
      const { formatDate } = useJobs();
      const threeDaysAgo = Date.now() - 3 * 86400000;

      const result = formatDate(threeDaysAgo);

      expect(result).toBe("3 days ago");
    });

    it('returns "Unknown" for null date', () => {
      const { formatDate } = useJobs();

      const result = formatDate(null);

      expect(result).toBe("Unknown");
    });
  });

  describe("fetchLatestJobs", () => {
    it("returns jobs on successful fetch", async () => {
      mockConvex.query.mockResolvedValue([mockJob]);

      const { fetchLatestJobs } = useJobs();
      const result = await fetchLatestJobs(10);

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].title).toBe("Network Security Engineer");
    });

    it("returns error on fetch failure", async () => {
      mockConvex.query.mockRejectedValue(new Error("Network error"));

      const { fetchLatestJobs } = useJobs();
      const result = await fetchLatestJobs(10);

      expect(result.error).toBe("Network error");
      expect(result.data).toBeNull();
    });

    it("applies filters correctly", async () => {
      const filteredJob = { ...mockJob, clearanceRequired: "SECRET" };
      mockConvex.query.mockResolvedValue([mockJob, filteredJob]);

      const { fetchLatestJobs } = useJobs();
      const result = await fetchLatestJobs(10, {
        clearance_required: "SECRET",
      });

      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].clearance_required).toBe("SECRET");
    });
  });

  describe("fetchJobById", () => {
    it("returns job when found", async () => {
      mockConvex.query.mockResolvedValue(mockJob);

      const { fetchJobById } = useJobs();
      const result = await fetchJobById("job-123");

      expect(result.error).toBeNull();
      expect(result.data?.title).toBe("Network Security Engineer");
    });

    it("returns error when job not found", async () => {
      mockConvex.query.mockResolvedValue(null);

      const { fetchJobById } = useJobs();
      const result = await fetchJobById("nonexistent");

      expect(result.error).toBe("Job not found");
      expect(result.data).toBeNull();
    });
  });
});
