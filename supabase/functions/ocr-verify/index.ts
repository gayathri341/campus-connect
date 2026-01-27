// Supabase Edge Runtime types
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { createWorker } from "https://esm.sh/tesseract.js@5.0.4"

// 🔐 CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

console.log("OCR Verify Function Started")

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

function normalize(text: string) {
  return text.replace(/\s+/g, " ").trim().toUpperCase()
}

function matchKeywords(text: string, keywords: string[]) {
  return keywords.filter(k => text.includes(k))
}

Deno.serve(async (req) => {

  // ✅ PRE-FLIGHT (MOST IMPORTANT)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { user_id, document_path, document_type } = await req.json()

    if (!user_id || !document_path || !document_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: corsHeaders }
      )
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { data: file, error } = await supabase.storage
      .from("verification-docs")
      .download(document_path)

    if (error || !file) throw new Error("File download failed")

    const buffer = new Uint8Array(await file.arrayBuffer())

    const worker = await createWorker()
    await worker.loadLanguage("eng")
    await worker.initialize("eng")

    const result = await worker.recognize(buffer)
    await worker.terminate()

    const rawText = result.data.text || ""
    const confidence = result.data.confidence ?? 0
    const text = normalize(rawText)

    const flags: string[] = []

    if (confidence < 60) flags.push("low_ocr_confidence")

    let matched: string[] = []

    if (document_type === "id_card") {
      matched = matchKeywords(text, COLLEGE_KEYWORDS)
      if (matched.length === 0) flags.push("college_keywords_missing")
    }

    if (document_type === "degree_certificate") {
      matched = matchKeywords(text, DEGREE_KEYWORDS)
      if (matched.length < 2) flags.push("degree_keywords_missing")
    }

    const auto_verdict =
      flags.length === 0 ? "auto_approved" : "manual_review"

    const status =
      auto_verdict === "auto_approved" ? "approved" : "pending"

    await supabase
      .from("verification_documents")
      .update({
        ocr_text: rawText,
        ocr_confidence: confidence,
        flags,
        auto_verdict,
        status,
      })
      .eq("user_id", user_id)

    return new Response(
      JSON.stringify({
        success: true,
        status,
        auto_verdict,
        flags,
        confidence,
        matched_keywords: matched,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (err) {
    console.error(err)
    return new Response(
      JSON.stringify({ error: "OCR failed" }),
      { status: 500, headers: corsHeaders }
    )
  }
})
