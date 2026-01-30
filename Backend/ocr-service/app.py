from flask import Flask, request, jsonify
import cv2
import pytesseract
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")


supabase = create_client(SUPABASE_URL, SERVICE_KEY)

app = Flask(__name__)

@app.route("/")
def home():
    return "OCR service running"

@app.route("/ocr-verify", methods=["POST"])
def ocr_verify():

    data = request.get_json(force=True)

    user_id = data["user_id"]
    image_path = data["local_path"]  # downloaded file

    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)[1]

    text = pytesseract.image_to_string(gray, lang="eng").upper()

    flags = []
    if "RMK" not in text and "ENGINEERING COLLEGE" not in text:
        flags.append("college_keywords_missing")

    auto_verdict = "auto_approved" if not flags else "manual_review"
    status = "approved" if auto_verdict == "auto_approved" else "pending"

    supabase.table("verification_documents").update({
        "extracted_text": text,
        "flags": flags,
        "auto_verdict": auto_verdict,
        "status": status
    }).eq("user_id", user_id).execute()

    return jsonify({"success": True, "auto_verdict": auto_verdict})

if __name__ == "__main__":
    app.run(port=5000)


