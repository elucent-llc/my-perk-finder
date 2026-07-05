import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), "../../.env") });
config();

export const env = {
  MOCK_EXTERNAL: (process.env.MOCK_EXTERNAL ?? "true") === "true",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "sk-mock-key",
  OPENAI_MODEL: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "re_mock_key",
  EMAIL_FROM: process.env.EMAIL_FROM ?? "deals@myperkfinder.com",
  AWIN_ACCESS_TOKEN: process.env.AWIN_ACCESS_TOKEN ?? "mock",
  AWIN_PUBLISHER_ID: process.env.AWIN_PUBLISHER_ID ?? "mock",
};
