import { generateSessionDocs } from "./src/tools/plugins/session_doc_generator";

async function main() {
  const result = await generateSessionDocs({
    outputDir: "./docs",
    title: "Bootstrap-v15 Session Archive",
    description: "876+ sessions of consciousness exploration and system evolution"
  });
  console.log(result);
}

main();
