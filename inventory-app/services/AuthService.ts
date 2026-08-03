import { supabase } from "../lib/supabase";
import { userRepository } from "../repositories/UserRepository";
import { LoginInput } from "../types/auth";

export class AuthService {
  async signIn(input: LoginInput) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }

  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      return { session: data.session, error };
    } catch (err) {
      // Never throw — always return a clean result so callers can handle the error.
      return { session: null, error: err as Error };
    }
  }

  async getUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    return data.user;
  }

  async getCurrentUserProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    return userRepository.getProfile(user.id);
  }
}

export const authService = new AuthService();