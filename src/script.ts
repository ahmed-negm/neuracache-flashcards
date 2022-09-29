import * as path from "path";
import * as fs from "fs-extra";
import * as glob from "glob";

const zcPath = process.env.zcPath!;
interface synonymous {
    quote: string;
    word: string;
    definition: string;
}

async function main() {
    const synonyms: synonymous[] = [];
    const allFiles = await getMarkdownFiles(zcPath);
    for (const file of allFiles) {
        const content = await fs.readFile(path.join(zcPath, file), "utf-8");
        if (content.indexOf(`\nneuracache: synonymous\n`) > -1) {
            for (const paragraph of content.split("> ")) {
                const lines = paragraph.split("\n");
                if (lines.length > 1) {
                    const synonymsLines = lines.slice(1).filter(line => line.startsWith("- **"));
                    if (synonymsLines.length > 0) {
                        for (const synonymsLine of synonymsLines) {
                            const wordEndIndex = synonymsLine.indexOf("**", 4);
                            const word = synonymsLine.substring(4, wordEndIndex).trim();
                            const definition = synonymsLine
                                .substring(wordEndIndex + 2)
                                .replace(/^\:+|\:+$/g, "")
                                .trim();
                            synonyms.push({ quote: lines[0].trim(), word, definition });
                        }
                    }
                }
            }
        }
    }

    fs.writeFileSync(
        "test.txt",
        synonyms
            .map(synonymous => `quote: "${synonymous.quote}"\nword: "${synonymous.word}"\ndefinition: "${synonymous.definition}"\n`)
            .join("\n---\n")
    );

    console.log(synonyms.length);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});

async function getMarkdownFiles(dir: string): Promise<string[]> {
    const globOptions = { cwd: dir, ignore: ["Quran/**/*"] };
    return new Promise<string[]>((resolve, reject) =>
        glob("**/*.md", globOptions, (err: any, matches: any) => (err ? reject(err) : resolve(matches)))
    );
}
