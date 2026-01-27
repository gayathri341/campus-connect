import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

console.log("OCR Space Verify Function Started")

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
  try {
    const { user_id, document_path, document_type } = await req.json()

    if (!user_id || !document_path || !document_type) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // 1️⃣ Download file from storage
    const { data: file } = await supabase
      .storage
      .from("verification-docs")
      .download(document_path)

    if (!file) throw new Error("File download failed")

    // Convert to base64
    const buffer = new Uint8Array(await file.arrayBuffer())
    const base64 = btoa(String.fromCharCode(...buffer))

    // 2️⃣ Call OCR.Space API
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

    const ocrData = await ocrRes.json()

    if (!ocrData.ParsedResults) {
      throw new Error("OCR failed")
    }

    const rawText = ocrData.ParsedResults[0].ParsedText || ""
    const confidence = 80 // OCR.Space free tier doesn’t give confidence

    const text = normalize(rawText)

    const flags: string[] = []
    let matched: string[] = []

    if (document_type === "id_card") {
      matched = matchKeywords(text, COLLEGE_KEYWORDS)
      if (matched.length === 0) flags.push("college_keywords_missing")
    }

    if (document_type === "degree_certificate") {
      matched = matchKeywords(text, DEGREE_KEYWORDS)
      if (matched.length < 2) flags.push("degree_keywords_missing")
    }

    const auto_verdict = flags.length === 0 ? "auto_approved" : "manual_review"
    const status = auto_verdict === "auto_approved" ? "approved" : "pending"

    // 3️⃣ Update DB
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

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: "OCR failed" }), { status: 500 })
  }
})
