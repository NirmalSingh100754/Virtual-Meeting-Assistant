from flask import Flask, request, jsonify
import spacy

app = Flask(__name__)
nlp = spacy.load("en_core_web_sm")


@app.route("/summarize", methods=["POST"])
def summarize():
    data = request.get_json()
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "No text provided"}), 400
    doc = nlp(text)
    sentences = [sent.text for sent in doc.sents]
    summary = " ".join(sentences[:])  # Simple summarizer
    return jsonify({"summary": summary})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3001)
