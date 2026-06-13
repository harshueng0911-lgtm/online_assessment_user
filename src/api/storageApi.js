import { supabase } from "../lib/supabase.js";

export const storageApi = {
  uploadFile: async (bucket, path, file) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;
    return data;
  },

  getPublicUrl: (bucket, path) => {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  },
};
