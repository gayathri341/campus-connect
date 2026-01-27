// Supabase Edge Runtime types
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { createWorker } from "https://esm.sh/tesseract.js@5.0.4"

console.log("OCR Verify Function Started")

// ---- KEYWORDS (YOU CAN EDIT LATER) ----
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

// ---- HELPER: keyword check ----
function matchKeywords(text: string, keywords: string[]) {
  const upper = text.toUpperCase()
  return keywords.filter(k => upper.includes(k))
}

Deno.serve(async (req) => {
  try {
    const body = await req.json()
    const { user_id, document_path, document_type } = body

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

    // ---- Download file from Storage ----
    const { data: file, error: downloadError } = await supabase
      .storage
      .from("verification-docs")
      .download(document_path)

    if (downloadError || !file) {
      throw new Error("Failed to download document")
    }

    const buffer = new Uint8Array(await file.arrayBuffer())

    // ---- OCR using Tesseract ----
    const worker = await createWorker("eng")
    const {
      data: { text, confidence },
    } = await worker.recognize(buffer)

    await worker.terminate()

    // ---- FLAGS & CHECKS ----
    const flags: string[] = []

    // confidence check
    if (confidence < 60) {
      flags.push("low_ocr_confidence")
    }

    // keyword checks
    let matched: string[] = []

    if (document_type === "id_card") {
      matched = matchKeywords(text, COLLEGE_KEYWORDS)
      if (matched.length < 1) {
        flags.push("college_keywords_missing")
      }
    }

    if (document_type === "degree_certificate") {
      matched = matchKeywords(text, DEGREE_KEYWORDS)
      if (matched.length < 2) {
        flags.push("degree_keywords_missing")
      }
    }

    // ---- AUTO VERDICT ----
    const auto_verdict =
      flags.length === 0 ? "auto_approved" : "manual_review"

    // ---- UPDATE DATABASE ----
    const { error: updateError } = await supabase
      .from("verification_documents")
      .update({
        ocr_text: text,
        ocr_confidence: confidence,
        flags,
        auto_verdict,
      })
      .eq("user_id", user_id)

    if (updateError) {
      throw new Error("Failed to update verification_documents")
    }

    return new Response(
      JSON.stringify({
        success: true,
        auto_verdict,
        flags,
        confidence,
        matched_keywords: matched,
      }),
      { headers: { "Content-Type": "application/json" } }
    )

  } catch (err) {
    console.error(err)
    return new Response(
      JSON.stringify({ error: "OCR verification failed" }),
      { status: 500 }
    )
  }
})
