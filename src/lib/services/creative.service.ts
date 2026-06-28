import { NotImplementedError } from "@/lib/errors";
import type {
  Creative,
  CreativeImage,
  CreativeImageInsert,
  CreativeInsert,
  CreativeUpdate,
} from "@/types/database";

/**
 * Creative + creative-image persistence. Implemented in the creative phases;
 * generation/scoring logic lives in the Creative Studio modules and calls this.
 */
export interface CreativeService {
  listByCampaign(campaignId: string): Promise<Creative[]>;
  get(id: string): Promise<Creative | null>;
  create(input: CreativeInsert): Promise<Creative>;
  update(id: string, patch: CreativeUpdate): Promise<Creative>;
  setFavorite(id: string, isFavorite: boolean): Promise<Creative>;
  remove(id: string): Promise<void>;
  addImage(input: CreativeImageInsert): Promise<CreativeImage>;
  listImages(creativeId: string): Promise<CreativeImage[]>;
}

const notImplemented = (method: string): never => {
  throw new NotImplementedError(`creativeService.${method}`, "platform");
};

export const creativeService: CreativeService = {
  async listByCampaign() {
    return notImplemented("listByCampaign");
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
  async setFavorite() {
    return notImplemented("setFavorite");
  },
  async remove() {
    return notImplemented("remove");
  },
  async addImage() {
    return notImplemented("addImage");
  },
  async listImages() {
    return notImplemented("listImages");
  },
};
