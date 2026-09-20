import { randomUUID } from "crypto";
import { localStorage } from "../../storage/localStorage.provider.js";
import { NotFoundError } from "../../errors/AppError.js";
import { robotLibraryRepository } from "./robotLibrary.repository.js";
import { resolveOrdFromUpload, type OrdUploadFiles } from "./ordUpload.helper.js";
import type { OrdDocument } from "./ord.schema.js";
import type { CreateRobotLibraryEntryInput } from "./robotLibrary.validators.js";

export type { OrdUploadFiles as CreateRobotLibraryEntryFiles } from "./ordUpload.helper.js";

export const robotLibraryService = {
  async create(ownerId: string, input: CreateRobotLibraryEntryInput, files: OrdUploadFiles) {
    const entryId = randomUUID();
    const basePath = `robot-library/${entryId}`;
    const ord = await resolveOrdFromUpload(basePath, files);

    const ordStorageKey = `${basePath}/robot.ord`;
    await localStorage.write(ordStorageKey, JSON.stringify(ord, null, 2));

    return robotLibraryRepository.create({
      id: entryId,
      ownerId,
      name: input.name,
      description: input.description,
      ordStorageKey,
      jointCount: ord.joints.length,
    });
  },

  async list(ownerId: string) {
    return robotLibraryRepository.listByOwner(ownerId);
  },

  async getById(id: string, ownerId: string) {
    const entry = await robotLibraryRepository.findById(id);
    if (!entry || entry.ownerId !== ownerId) throw new NotFoundError("Robot library entry not found");
    return entry;
  },

  async getOrdDocument(id: string, ownerId: string): Promise<OrdDocument> {
    const entry = await robotLibraryService.getById(id, ownerId);
    const buffer = await localStorage.read(entry.ordStorageKey);
    return JSON.parse(buffer.toString("utf-8"));
  },

  async remove(id: string, ownerId: string) {
    const entry = await robotLibraryService.getById(id, ownerId);
    // Storage cleanup best-effort: remove the whole per-entry directory tree
    // by deleting the known files; mesh files live under the same prefix.
    await localStorage.delete(entry.ordStorageKey);
    await robotLibraryRepository.remove(entry.id);
  },
};
