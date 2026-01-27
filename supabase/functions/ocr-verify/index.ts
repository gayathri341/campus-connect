// Supabase Edge Runtime types
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { createWorker } from "https://esm.sh/tesseract.js@5.0.4"

console.log("OCR Verify Function Started")

// ---- KEYWORDS (EDIT ANYTIME) ----
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

// ---- HELPERS ----
function normalize(text: string) {
  return text.replace(/\s+/g, " ").trim().toUpperCase()
}

function matchKeywords(text: string, keywords: string[]) {
  return keywords.filter(k => text.includes(k))
}

Deno.serve(async (req) => {
  try {
    const { user_id, document_path, document_type } = await req.json()

    if (!user_id || !document_path || !document_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      )
    }

    // ---- Supabase client (SERVICE ROLE) ----
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // ---- Download document ----
    const { data: file, error: downloadError } = await supabase
      .storage
      .from("verification-docs")
      .download(document_path)

    if (downloadError || !file) {
      throw new Error("Failed to download document")
    }

    const buffer = new Uint8Array(await file.arrayBuffer())

    // ---- OCR (STABLE INIT) ----
    const worker = await createWorker()
    await worker.loadLanguage("eng")
    await worker.initialize("eng")

    const ocrResult = await worker.recognize(buffer)
    await worker.terminate()

    const rawText = ocrResult.data.text || ""
    const confidence = ocrResult.data.confidence ?? 0

    const text = normalize(rawText)

    // ---- FLAGS ----
    const flags: string[] = []

    if (confidence < 60) {
      flags.push("low_ocr_confidence")
    }

    let matched: string[] = []

    if (document_type === "id_card") {
      matched = matchKeywords(text, COLLEGE_KEYWORDS)
      if (matched.length === 0) {
        flags.push("college_keywords_missing")
      }
    }

    if (document_type === "degree_certificate") {
      matched = matchKeywords(text, DEGREE_KEYWORDS)
      if (matched.length < 2) {
        flags.push("degree_keywords_missing")
      }
    }

    // ---- VERDICT ----
    const auto_verdict =
      flags.length === 0 ? "auto_approved" : "manual_review"

    const status =
      auto_verdict === "auto_approved" ? "approved" : "pending"

    // ---- UPDATE DB (only if pending) ----
    const { error: updateError } = await supabase
      .from("verification_documents")
      .update({
        ocr_text: rawText,
        ocr_confidence: confidence,
        flags,
        auto_verdict,
        status,
      })
      .eq("user_id", user_id)
      .eq("status", "pending")

    if (updateError) {
      throw new Error("Failed to update verification_documents")
    }

    return new Response(
      JSON.stringify({
        success: true,
        auto_verdict,
        status,
        confidence,
        flags,
        matched_keywords: matched,
      }),
      { headers: { "Content-Type": "application/json" } }
    )

  } catch (err) {
    console.error("OCR error:", err)
    return new Response(
      JSON.stringify({ error: "OCR verification failed" }),
      { status: 500 }
    )
  }
})
