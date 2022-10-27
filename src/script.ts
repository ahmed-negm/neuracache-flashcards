import { generateSlipBox } from "./slipBox";
import { generateSynonyms } from "./synonyms";
import { getAllverses, getMarkdownFiles, zcPath } from "./utils";

async function main() {
    const allverses = getAllverses();
    const allFiles = await getMarkdownFiles(zcPath);

    await generateSynonyms(allFiles, allverses);
    await generateSlipBox(allFiles, allverses);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
