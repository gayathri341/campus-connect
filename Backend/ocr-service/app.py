from flask import Flask, request, jsonify
from flask_cors import CORS   
import cv2
import pytesseract
from supabase import create_client
from dotenv import load_dotenv
import os
import tempfile

load_dotenv()

# ---- ENV ----
SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
TESSERACT_CMD = os.getenv("TESSERACT_CMD")

pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

supabase = create_client(SUPABASE_URL, SERVICE_KEY)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route("/")
def home():
    return "OCR service running"

@app.route("/ocr-verify", methods=["POST"])
def ocr_verify():

    data = request.get_json(force=True)

    user_id = data["user_id"]
    document_path = data["document_path"]   # ✅ FROM SUPABASE STORAGE
    document_type = data.get("document_type", "id_card")

    # ---- DOWNLOAD FILE FROM SUPABASE STORAGE ----
    res = supabase.storage.from_("verification-docs").download(document_path)

    if not res:
        return jsonify({"error": "Failed to download file"}), 400

    # ---- SAVE TEMP FILE ----
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        tmp.write(res)
        temp_path = tmp.name

    # ---- IMAGE READ ----
    img = cv2.imread(temp_path)

    if img is None:
        return jsonify({"error": "Image decode failed"}), 400

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)[1]

    # ---- OCR ----
    text = pytesseract.image_to_string(gray, lang="eng").upper()

    # ---- VERIFICATION LOGIC ----
    flags = []
    if "RMK" not in text and "ENGINEERING COLLEGE" not in text:
        flags.append("college_keywords_missing")

    auto_verdict = "approved" if not flags else "manual_review"
    status = "approved" if auto_verdict == "approved" else "pending"

    # ---- UPDATE verification_documents ----
    supabase.table("verification_documents").update({
        "extracted_text": text,
        "flags": flags,
        "auto_verdict": auto_verdict,
        "status": status
    }).eq("user_id", user_id).execute()

    # ---- AUTO VERIFY PROFILE ----
    if status == "approved":
        supabase.table("profiles").update({
            "is_verified": True
        }).eq("id", user_id).execute()

    return jsonify({
        "success": True,
        "auto_verdict": auto_verdict,
        "status": status
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
