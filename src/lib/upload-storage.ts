import { mkdir, writeFile } from "node:fs/promises";
import { getPublicUploadUrl, getUploadPath, getUploadRoot } from "@/lib/upload-paths";
import path from "node:path";

export { getPublicUploadUrl, getUploadPath, getUploadRoot };

export async function writeUploadFile(
  folder: string,
  filename: string,
  bytes: Buffer
) {
  const uploadDir = path.join(getUploadRoot(), folder);
  await mkdir(uploadDir, { recursive: true });
  const diskPath = getUploadPath(folder, filename);
  await writeFile(diskPath, bytes);
  return diskPath;
}
