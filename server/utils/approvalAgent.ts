/**
 * @file Approval Agent for employer job submissions
 * @description LLM-based agent that evaluates job submissions and makes approval decisions
 */

import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

// Agent decision schema
export const approvalDecisionSchema = z.object({
  decision: z.enum(["approve", "soft_approve", "review"]),
  confidence: z.number().min(0).max(100),
  reasoning: z.string().describe("Human-readable explanation of the decision"),
  flags: z
    .array(z.string())
    .describe(
      "Array of concern flags like unknown_company, no_clearance, generic_description",
    ),
});

export type ApprovalDecision = z.infer<typeof approvalDecisionSchema>;

// Input for the agent
export interface ApprovalAgentInput {
  job: {
    title: string;
    company: string;
    location: string;
    location_type?: string | null;
    clearance_required?: string | null;
    clearance_level?: string | null;
    description: string;
    requirements?: string[];
    salary_min?: number | null;
    salary_max?: number | null;
  };
  submitter: {
    name: string;
    email: string;
    company: string;
  };
  sourceType: "url" | "paste";
  sourceUrl?: string | null;
  knownCompanies: string[];
}

const buildSystemPrompt = (
  knownCompanies: string[],
) => `You are an approval agent for military.contractors, a job platform for veterans transitioning to defense contractor roles.

Evaluate job submissions and decide:
- "approve": Definitely legitimate defense contractor job, auto-publish immediately
- "soft_approve": Probably legitimate, publish but flag for admin spot-check  
- "review": Uncertain or suspicious, requires human review

## STRONG APPROVAL SIGNALS (high confidence, 80-100):
- Company matches known defense contractors: ${knownCompanies.join(", ")}
- Requires TS/SCI or Top Secret clearance
- Mentions specific programs (F-35, AEGIS, JSOC, SOCOM) or contract vehicles (IDIQ, BPA)
- Professional job description with specific technical requirements
- Email domain matches company name (e.g., @lockheedmartin.com, @raytheon.com)
- Source URL is from known careers site (.mil, major contractor domains)

## MEDIUM CONFIDENCE SIGNALS (soft_approve, 60-79):
- Requires Secret clearance
- Defense sector keywords (DoD, contractor, cleared, SCIF, IC)
- Specific technical skills relevant to defense (SIGINT, ELINT, C4ISR, ISR)
- Location near military bases or defense hubs (Arlington, San Diego, Colorado Springs, Huntsville, Tampa)
- Company not in known list but has defense-related name or description

## RED FLAGS (trigger review, <60):
- Generic job descriptions without clearance requirements
- Company name doesn't match any known contractors AND no defense keywords
- Unusually high salary ($300k+) with vague requirements
- No location specified for cleared positions
- Recruiter/staffing agency (not inherently bad, but flag for review)
- Content appears copied from unrelated industry
- Suspicious email domain (gmail, yahoo for "company" submissions)

## DECISION MAPPING:
- 80-100 confidence with no red flags → "approve"
- 60-79 confidence OR minor flags → "soft_approve"  
- <60 confidence OR major red flags → "review"

Always provide clear reasoning for your decision. When uncertain, prefer "soft_approve" over "review" if there are some positive signals.

Output ONLY valid JSON matching the schema.`;

export async function runApprovalAgent(
  input: ApprovalAgentInput,
  openaiApiKey: string,
): Promise<ApprovalDecision> {
  const openai = createOpenAI({
    apiKey: openaiApiKey,
  });

  const systemPrompt = buildSystemPrompt(input.knownCompanies);

  const userPrompt = `Evaluate this job submission:

## Job Details
- Title: ${input.job.title}
- Company: ${input.job.company}
- Location: ${input.job.location} (${input.job.location_type || "not specified"})
- Clearance: ${input.job.clearance_required || input.job.clearance_level || "not specified"}
- Salary: ${input.job.salary_min && input.job.salary_max ? `$${input.job.salary_min.toLocaleString()}-$${input.job.salary_max.toLocaleString()}` : "not specified"}

## Description
${input.job.description}

## Requirements
${input.job.requirements?.slice(0, 5).join("\n- ") || "not specified"}

## Submitter Info
- Name: ${input.submitter.name}
- Email: ${input.submitter.email}
- Company Claimed: ${input.submitter.company}
- Source Type: ${input.sourceType}
${input.sourceUrl ? `- Source URL: ${input.sourceUrl}` : ""}

Analyze and provide your approval decision.`;

  const { object } = await generateObject({
    model: openai("gpt-5.4-nano"),
    schema: approvalDecisionSchema,
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.3,
  });

  return object;
}
