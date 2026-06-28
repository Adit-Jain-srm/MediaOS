import { NotImplementedError } from "@/lib/errors";
import type { Campaign, CampaignInsert, CampaignUpdate } from "@/types/database";

/**
 * Campaign CRUD + lifecycle. Implemented (campaigns phase) against the typed
 * Supabase server client; reads/writes are RLS-scoped to the current user.
 */
export interface CampaignService {
  list(): Promise<Campaign[]>;
  get(id: string): Promise<Campaign | null>;
  create(input: CampaignInsert): Promise<Campaign>;
  update(id: string, patch: CampaignUpdate): Promise<Campaign>;
  setStatus(id: string, status: string): Promise<Campaign>;
  remove(id: string): Promise<void>;
}

const notImplemented = (method: string): never => {
  throw new NotImplementedError(`campaignService.${method}`, "platform");
};

export const campaignService: CampaignService = {
  async list() {
    return notImplemented("list");
  },
  async get() {
    return notImplemented("get");
  },
  async create() {
    return notImplemented("create");
  },
  async update() {
    return notImplemented("update");
  },
  async setStatus() {
    return notImplemented("setStatus");
  },
  async remove() {
    return notImplemented("remove");
  },
};
