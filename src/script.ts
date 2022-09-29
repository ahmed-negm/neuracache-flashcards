import * as path from "path";
import * as fs from "fs-extra";
import * as glob from "glob";

const zcPath = process.env.zcPath!;
const neuraCachePath = process.env.neuraCachePath!;
interface ISynonymous {
    quote: string;
    word: string;
    definition: string;
}

interface IVerse {
    link: string;
    ayah: string;
}

async function main() {
    const allverses = getAllverses();
    const allFiles = await getMarkdownFiles(zcPath);

    await fs.rm(path.join(neuraCachePath, "synonyms"), { recursive: true, force: true });

    for (const file of allFiles) {
        const synonyms: ISynonymous[] = [];
        let tags: string[] = [];

        const content = await fs.readFile(path.join(zcPath, file), "utf-8");
        if (content.indexOf(`\nneura-cache: synonymous\n`) > -1) {
            const tagsMetadata = `\nneura-cache-tags:`;
            const tagsIndex = content.indexOf(tagsMetadata);

            if (tagsIndex > -1) {
                tags = content
                    .substring(tagsIndex + tagsMetadata.length, content.indexOf(`\n`, tagsIndex + tagsMetadata.length))
                    .split(" ")
                    .map(tag => tag.trim())
                    .filter(tag => !!tag);
            }

            for (const paragraph of content.split("> ")) {
                const lines = paragraph.split("\n");
                if (lines.length > 1) {
                    const synonymsLines = lines.slice(1).filter(line => line.startsWith("- **"));
                    if (synonymsLines.length > 0) {
                        for (const synonymsLine of synonymsLines) {
                            const wordEndIndex = synonymsLine.indexOf("**", 4);
                            const word = synonymsLine.substring(4, wordEndIndex).trim();
                            const definition = replaceVerseLinks(
                                synonymsLine
                                    .substring(wordEndIndex + 2)
                                    .replace(/^\:+|\:+$/g, "")
                                    .trim(),
                                allverses
                            );

                            synonyms.push({ quote: lines[0].trim(), word, definition });
                        }
                    }
                }
            }
            const neuraCacheTags = tags.length ? `#tags ${tags.map(tag => `#${tag}`).join(" ")}\n\n` : "";

            if (synonyms.length) {
                fs.outputFile(
                    path.join(neuraCachePath, "synonyms", file),
                    neuraCacheTags +
                        synonyms
                            .map(
                                synonymous =>
                                    `#flashcard\nما معنى: ${synonymous.word}\n${synonymous.quote}\n- - -\nمعنى: ${synonymous.word}\n${synonymous.quote}\n\n${synonymous.definition}\n- - -\n`
                            )
                            .join("\n")
                );
            }
        }
    }
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

function getAllverses() {
    const allverses: IVerse[] = [];

    const quranJsonPath = require.resolve("quran-json/dist/quran.json");
    const surahs = fs.readJsonSync(quranJsonPath);

    for (const surah of surahs) {
        for (const verse of surah.verses) {
            allverses.push({ link: `[[${surah.name}-${verse.id}]]`, ayah: verse.text });
        }
    }

    return allverses;
}

function replaceVerseLinks(definition: string, allverses: IVerse[]) {
    for (const verse of allverses) {
        definition = definition.replace(verse.link, `"${verse.ayah}"`);
    }

    return definition;
}
