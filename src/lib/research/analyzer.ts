import { NotImplementedError } from "@/lib/errors";
import type {
  AudienceSegment,
  BuyingTrigger,
  PainPoint,
  QueryParams,
  ResearchResult,
  SourceCitation,
} from "./standard-models";

/**
 * AI analysis layer (GPT-4o) that turns merged provider data into actionable
 * intelligence: synthesized personas, extracted pain points, buying triggers,
 * and opportunity detection - each carrying source citations. Implemented in the
 * research-ai phase against this interface.
 */

export type OpportunityType =
  | "high_pain_low_competition"
  | "pre_saturation_trend"
  | "messaging_gap"
  | "audience_expansion";

export interface Opportunity {
  title: string;
  rationale: string;
  type: OpportunityType;
  confidence?: number;
  sources: SourceCitation[];
}

export interface AnalyzeInput {
  params: QueryParams;
  result: ResearchResult;
  signal?: AbortSignal;
}

export interface ResearchAnalyzer {
  /** Synthesize distinct audience personas across all providers. */
  synthesizePersonas(input: AnalyzeInput): Promise<AudienceSegment[]>;
  /** Extract and rank pain points in the audience's own words. */
  extractPainPoints(input: AnalyzeInput): Promise<PainPoint[]>;
  /** Detect buying triggers and their urgency. */
  detectBuyingTriggers(input: AnalyzeInput): Promise<BuyingTrigger[]>;
  /** Surface high-leverage opportunities (high-pain/low-competition, etc.). */
  detectOpportunities(input: AnalyzeInput): Promise<Opportunity[]>;
}

class StubResearchAnalyzer implements ResearchAnalyzer {
  async synthesizePersonas(): Promise<AudienceSegment[]> {
    throw new NotImplementedError("ResearchAnalyzer.synthesizePersonas (research-ai phase)", "research");
  }
  async extractPainPoints(): Promise<PainPoint[]> {
    throw new NotImplementedError("ResearchAnalyzer.extractPainPoints (research-ai phase)", "research");
  }
  async detectBuyingTriggers(): Promise<BuyingTrigger[]> {
    throw new NotImplementedError("ResearchAnalyzer.detectBuyingTriggers (research-ai phase)", "research");
  }
  async detectOpportunities(): Promise<Opportunity[]> {
    throw new NotImplementedError("ResearchAnalyzer.detectOpportunities (research-ai phase)", "research");
  }
}

let analyzer: ResearchAnalyzer | null = null;

export function getResearchAnalyzer(): ResearchAnalyzer {
  if (!analyzer) analyzer = new StubResearchAnalyzer();
  return analyzer;
}

/** Hook for the research-ai phase to install the real GPT-4o analyzer. */
export function setResearchAnalyzer(custom: ResearchAnalyzer): void {
  analyzer = custom;
}
