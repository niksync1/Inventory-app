import { supabase } from "../lib/supabase";

export class StorageRepository {
  async getPublicUrl(bucket: string, path: string): Promise<string | null> {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl ?? null;
  }

  async upload(
    bucket: string,
    path: string,
    file: Blob | Uint8Array | ArrayBuffer
  ): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);

    if (error) {
      throw error;
    }

    return data.path;
  }

  async delete(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      throw error;
    }
  }
}

export const storageRepository = new StorageRepository();