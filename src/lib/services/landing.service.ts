import { NotImplementedError } from "@/lib/errors";
import type {
  LandingPage,
  LandingPageInsert,
  LandingPageUpdate,
  Lead,
  LeadInsert,
  PageView,
  PageViewInsert,
} from "@/types/database";

/**
 * Landing page lifecycle + public capture. `getBySlug`, `captureLead`, and
 * `recordView` serve the public `/lp/[slug]` route and must validate against a
 * DEPLOYED page (capture uses the service-role client per RLS design).
 */
export interface LandingService {
  listByCampaign(campaignId: string): Promise<LandingPage[]>;
  get(id: string): Promise<LandingPage | null>;
  /** Public: fetch a deployed page by slug for rendering. */
  getBySlug(slug: string): Promise<LandingPage | null>;
  create(input: LandingPageInsert): Promise<LandingPage>;
  update(id: string, patch: LandingPageUpdate): Promise<LandingPage>;
  deploy(id: string): Promise<LandingPage>;
  remove(id: string): Promise<void>;
  /** Public: capture a lead submitted from a deployed page. */
  captureLead(input: LeadInsert): Promise<Lead>;
  /** Public: record a page view for analytics. */
  recordView(input: PageViewInsert): Promise<PageView>;
}

const notImplemented = (method: string): never => {
  throw new NotImplementedError(`landingService.${method}`, "platform");
};

export const landingService: LandingService = {
  async listByCampaign() {
    return notImplemented("listByCampaign");
  },
  async get() {
    return notImplemented("get");
  },
  async getBySlug() {
    return notImplemented("getBySlug");
  },
  async create() {
    return notImplemented("create");
  },
  async update() {
    return notImplemented("update");
  },
  async deploy() {
    return notImplemented("deploy");
  },
  async remove() {
    return notImplemented("remove");
  },
  async captureLead() {
    return notImplemented("captureLead");
  },
  async recordView() {
    return notImplemented("recordView");
  },
};
