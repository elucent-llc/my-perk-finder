export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production") {
    const { getWebEnv } = await import("@mpf/env/web");
    getWebEnv();
  }
}
