import { storageApi } from "../api/storageApi.js";

// Placeholder storage helpers for resumes, profile pictures, certificates.
export const storageService = {
  upload: async (bucket, path, file) => {
    return storageApi.uploadFile(bucket, path, file);
  },
  getPublicUrl: (bucket, path) => {
    return storageApi.getPublicUrl(bucket, path);
  },
};
