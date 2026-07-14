type SupabaseOtpResponse = {
  access_token?: string;
  refresh_token?: string;
  user?: {
    id?: string;
    phone?: string;
    email?: string;
  };
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function requireConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable Supabase Auth.");
  }
  return { url: SUPABASE_URL.replace(/\/$/, ""), key: SUPABASE_ANON_KEY };
}

async function supabaseFetch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const { url, key } = requireConfig();
  const response = await fetch(`${url}/auth/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.msg || data?.error_description || data?.error || "Supabase Auth request failed.");
  }
  return data as T;
}

export function signInWithProvider(provider: "google" | "apple") {
  const { url, key } = requireConfig();
  const redirectTo = `${window.location.origin}/app`;
  const params = new URLSearchParams({
    provider,
    redirect_to: redirectTo,
  });

  window.location.href = `${url}/auth/v1/authorize?${params.toString()}&apikey=${encodeURIComponent(key)}`;
}

export async function sendMobileOtp(phone: string) {
  return supabaseFetch("otp", {
    phone,
    create_user: true,
    channel: "sms",
  });
}

export async function verifyMobileOtp(phone: string, token: string) {
  const session = await supabaseFetch<SupabaseOtpResponse>("verify", {
    phone,
    token,
    type: "sms",
  });

  if (session.access_token) {
    localStorage.setItem("onelife_supabase_session", JSON.stringify(session));
  }

  return session;
}
