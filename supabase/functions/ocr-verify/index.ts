import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

console.log("OCR Space Verify Function Started")

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const COLLEGE_KEYWORDS = [
  "RMK",
  "RMK ENGINEERING COLLEGE",
  "R.M.K",
]

const DEGREE_KEYWORDS = [
  "BACHELOR OF TECHNOLOGY",
  "B.TECH",
  "INFORMATION TECHNOLOGY",
  "IT",
]

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { user_id, document_path, document_type } = await req.json()

    if (!user_id || !document_path || !document_type) {
      return new Response(
        JSON.stringify({ error: "Missing fields" }),
        { status: 400, headers: corsHeaders }
      )
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    /* --------------------------------------------------
       1️⃣ DOWNLOAD FILE
    -------------------------------------------------- */
    const { data: file } = await supabase
      .storage
      .from("verification-docs")
      .download(document_path)

    if (!file) {
      throw new Error("File download failed")
    }

    /* --------------------------------------------------
       2️⃣ OCR SPACE CALL
    -------------------------------------------------- */
    const formData = new FormData()
    formData.append("file", file, "document.png")
    formData.append("language", "eng")

    const ocrRes = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        apikey: Deno.env.get("OCR_SPACE_API_KEY")!,
      },
      body: formData,
    })

    const ocrData = await ocrRes.json()

    const rawText =
      ocrData?.ParsedResults?.[0]?.ParsedText ?? ""

    const text = rawText.toUpperCase()
    const confidence = 80

    /* --------------------------------------------------
       3️⃣ KEYWORD CHECK
    -------------------------------------------------- */
    const flags: string[] = []

    if (document_type === "id_card") {
      if (!COLLEGE_KEYWORDS.some(k => text.includes(k))) {
        flags.push("college_keywords_missing")
      }
    }

    if (document_type === "degree_certificate") {
      const matches = DEGREE_KEYWORDS.filter(k => text.includes(k))
      if (matches.length < 2) {
        flags.push("degree_keywords_missing")
      }
    }

    const auto_verdict =
      flags.length === 0 ? "auto_approved" : "manual_review"

    const status =
      auto_verdict === "auto_approved" ? "approved" : "pending"

    /* --------------------------------------------------
       4️⃣ SINGLE FINAL DB WRITE (UPSERT)
    -------------------------------------------------- */
    console.log("BEFORE FINAL DB WRITE", user_id)

    await supabase
      .from("verification_documents")
      .upsert({
        user_id,
        document_url: document_path,
        document_type,
        extracted_text: rawText,
        ocr_confidence: confidence,
        flags,
        auto_verdict,
        status,
      }, { onConflict: "user_id" })

    console.log("AFTER FINAL DB WRITE", user_id)

    return new Response(
      JSON.stringify({ success: true, auto_verdict }),
      { headers: corsHeaders }
    )

  } catch (err) {
    console.error("OCR ERROR:", err)

    return new Response(
      JSON.stringify({
        error: "OCR failed",
        message: err instanceof Error ? err.message : err,
      }),
      { status: 500, headers: corsHeaders }
    )
  }
})
