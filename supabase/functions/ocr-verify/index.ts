import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { encode as base64Encode } from "https://deno.land/std@0.224.0/encoding/base64.ts"

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
  // ✅ CORS PREFLIGHT
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // ✅ SAFE JSON PARSE
    const body = await req.json().catch(() => null)
    if (!body) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: corsHeaders }
      )
    }

    const { user_id, document_path, document_type } = body

    if (!user_id || !document_path || !document_type) {
      return new Response(
        JSON.stringify({ error: "Missing fields" }),
        { status: 400, headers: corsHeaders }
      )
    }

    // ✅ SUPABASE CLIENT
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // ✅ DOWNLOAD DOCUMENT
    const { data: file, error: fileError } = await supabase
      .storage
      .from("verification-docs")
      .download(document_path)

    if (fileError || !file) {
      throw new Error("File download failed")
    }

    // ✅ SAFE BASE64 CONVERSION (FIXED)
    const buffer = new Uint8Array(await file.arrayBuffer())
    const base64 = base64Encode(buffer)

    // ✅ OCR API CALL
    const ocrRes = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        apikey: Deno.env.get("OCR_SPACE_API_KEY")!,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        base64Image: `data:image/png;base64,${base64}`,
        language: "eng",
      }),
    })

    if (!ocrRes.ok) {
      throw new Error("OCR API request failed")
    }

    const ocrData = await ocrRes.json()

    if (!ocrData?.ParsedResults?.length) {
      throw new Error("No text detected from OCR")
    }

    const rawText = ocrData.ParsedResults[0].ParsedText || ""
    const text = rawText.toUpperCase()
    const confidence = 80

    // ✅ KEYWORD VERIFICATION
    const flags: string[] = []
    let matched: string[] = []

    if (document_type === "id_card") {
      matched = COLLEGE_KEYWORDS.filter(k => text.includes(k))
      if (matched.length === 0) flags.push("college_keywords_missing")
    }

    if (document_type === "degree_certificate") {
      matched = DEGREE_KEYWORDS.filter(k => text.includes(k))
      if (matched.length < 2) flags.push("degree_keywords_missing")
    }

    const auto_verdict =
      flags.length === 0 ? "auto_approved" : "manual_review"

    const status =
      auto_verdict === "auto_approved" ? "approved" : "pending"

    // ✅ DB UPDATE (SAFE TARGET)
    const { error: updateError } = await supabase
      .from("verification_documents")
      .update({
        ocr_text: rawText,
        ocr_confidence: confidence,
        flags,
        auto_verdict,
        status,
      })
      .eq("document_path", document_path)

    if (updateError) {
      throw new Error("Database update failed")
    }

    return new Response(
      JSON.stringify({ success: true, auto_verdict }),
      { headers: corsHeaders }
    )

  } catch (err) {
    console.error("OCR ERROR:", err)

    return new Response(
      JSON.stringify({
        error: "OCR failed",
        message: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500, headers: corsHeaders }
    )
  }
})
