
import express from "express";
import cors from "cors";
import multer from "multer";
import PDFParse from "pdf-parse";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer();

app.post("/check", upload.single("pdf"), async (req, res) => {
  try {
    const pdfBuffer = req.file.buffer;
    const rules = JSON.parse(req.body.rules);

    const pdfData = await PDFParse(pdfBuffer);
    const text = pdfData.text;

    const results = [];

    for (let rule of rules) {
      const prompt = `
PDF TEXT:
${text}

RULE: ${rule}

You must respond in this exact JSON structure:
{
  "rule": "",
  "status": "pass/fail",
  "evidence": "",
  "reasoning": "",
  "confidence": 0-100
}
`;

      const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await aiRes.json();
      const output = JSON.parse(data.choices[0].message.content);

      results.push(output);
    }

    res.json({ results });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server Error" });
  }
});

app.listen(3000, () => console.log("Backend running"));
