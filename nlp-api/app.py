from flask import Flask, request, jsonify
import spacy
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:3001"])
nlp = spacy.load("en_core_web_sm")

from collections import Counter

def summarize_meeting_text(text):
    doc = nlp(text)

    # Extract noun chunks for frequency-based keyword scoring
    keywords = [chunk.text.lower() for chunk in doc.noun_chunks if 1 < len(chunk.text.split()) < 5]
    keyword_freq = Counter(keywords)

    # Score sentences
    sentence_scores = []
    for sent in doc.sents:
        score = sum(keyword_freq.get(word.text.lower(), 0) for word in sent 
                    if not word.is_stop and not word.is_punct)
        sentence_scores.append((sent.text.strip(), score))

    # Sort and select top sentences
    ranked = sorted(sentence_scores, key=lambda x: x[1], reverse=True)

    # Generate output
    summary_sentences = [text for text, score in ranked[:3]]
    mom_sentences = [text for text, score in ranked[:5]]

    minutes_of_meeting = ["• " + sentence for sentence in mom_sentences]
    summary = " ".join(summary_sentences)

    return minutes_of_meeting, summary


@app.route("/summarize", methods=["POST"])
def summarize():
    data = request.get_data(as_text=True)
    import json
    try:
        data = json.loads(data)
    except Exception:
        return jsonify({"error": "Invalid JSON"}), 400
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "No text provided"}), 400
    minutes_of_meeting, summary = summarize_meeting_text(text)
    return jsonify({"minutes_of_meeting": minutes_of_meeting, "summary": summary})


if __name__ == "__main__":
    import sys
    port = 5001
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    app.run(host="0.0.0.0", port=port)
