import { supabase } from "../lib/supabase";
import { UserProfile } from "../types/auth";

export class UserRepository {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data as UserProfile | null;
  }

  async updateProfile(
    userId: string,
    updates: Partial<Pick<UserProfile, "name" | "avatar_url">>
  ): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (error) {
      throw error;
    }
  }
}

export const userRepository = new UserRepository();