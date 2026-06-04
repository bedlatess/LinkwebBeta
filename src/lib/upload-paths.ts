export function getUploadRoot() {
  return process.env.LINKWEB_UPLOAD_DIR || "data/uploads";
}

export function getPublicUploadUrl(folder: string, filename: string) {
  return `/uploads/${folder}/${filename}`;
}

export function getUploadPath(folder: string, filename: string) {
  return `${getUploadRoot()}/${folder}/${filename}`;
}
