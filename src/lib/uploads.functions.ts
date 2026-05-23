import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const schema = z.object({
  base64: z.string().min(1).max(Math.ceil(MAX_BYTES * 1.4)), // base64 overhead
  contentType: z.string().min(3).max(64),
  ext: z.string().min(1).max(8).regex(/^[a-zA-Z0-9]+$/),
});

export const uploadCustomerImage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    if (!ALLOWED.has(data.contentType.toLowerCase())) {
      throw new Error("Unsupported image type");
    }
    const bytes = Buffer.from(data.base64, "base64");
    if (bytes.byteLength === 0) throw new Error("Empty file");
    if (bytes.byteLength > MAX_BYTES) throw new Error("File too large (max 8 MB)");

    const path = `${crypto.randomUUID()}.${data.ext.toLowerCase()}`;
    const { error } = await supabaseAdmin.storage.from("customer_uploads").upload(path, bytes, {
      contentType: data.contentType,
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw new Error(error.message);
    return { path };
  });
