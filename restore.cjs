const fs = require("fs");
const transcriptPath =
  "C:/Users/nicol/.gemini/antigravity-ide/brain/08d91250-619e-42aa-8a98-2217c1afab47/.system_generated/logs/transcript.jsonl";
const lines = fs.readFileSync(transcriptPath, "utf8").split("\n");

let produtosContent = {};

for (const line of lines) {
  if (!line) continue;
  try {
    const obj = JSON.parse(line);
    const str = JSON.stringify(obj);
    if (
      str.includes("Tf-Brand") &&
      str.includes("produtos.tsx") &&
      str.includes("The following code has been modified")
    ) {
      const outputMatch = str.match(/"output":"([^"]+)"/);
      if (outputMatch) {
        const decoded = outputMatch[1]
          .replace(/\\n/g, "\n")
          .replace(/\\"/g, '"')
          .replace(/\\t/g, "\t");
        const mLines = decoded.split("\n");
        for (const ml of mLines) {
          const m = ml.match(/^(\d+): (.*)$/);
          if (m) {
            produtosContent[parseInt(m[1])] = m[2];
          }
        }
      }
    }
  } catch (e) {}
}

const maxLine = Math.max(...Object.keys(produtosContent).map(Number));
if (maxLine > 0) {
  let finalProdutos = "";
  for (let i = 1; i <= maxLine; i++) {
    finalProdutos += (produtosContent[i] !== undefined ? produtosContent[i] : "") + "\n";
  }
  fs.writeFileSync("src/routes/produtos.tsx", finalProdutos);
  console.log("Restored produtos.tsx, lines: " + maxLine);
} else {
  console.log("Failed to find lines");
}
