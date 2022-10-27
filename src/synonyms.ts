import * as path from "path";
import * as fs from "fs-extra";

import { getTags, IVerse, neuraCachePath, replaceVerseLinks, zcPath } from "./utils";

interface ISynonymous {
    quote: string;
    word: string;
    definition: string;
}

export async function generateSynonyms(allFiles: string[], allverses: IVerse[]) {
    await fs.rm(path.join(neuraCachePath, "synonyms"), { recursive: true, force: true });

    for (const file of allFiles) {
        const synonyms: ISynonymous[] = [];
        let tags: string[] = [];

        const content = await fs.readFile(path.join(zcPath, file), "utf-8");
        const neuraCacheMetadataIndex = content.indexOf(`\nneura-cache: `);
        if (neuraCacheMetadataIndex > -1) {
            const neuraCacheMetadata = content
                .substring(neuraCacheMetadataIndex, content.indexOf("\n", neuraCacheMetadataIndex + 10))
                .split(" ");

            tags = getTags(content, "neura-cache-tags");

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

                            if (neuraCacheMetadata.indexOf("synonymous") > -1) {
                                synonyms.push({ quote: lines[0].trim(), word, definition });
                            }
                        }
                    }

                    if (neuraCacheMetadata.indexOf("explanation") > -1) {
                        if (lines[1].startsWith("- ") && !lines[1].startsWith("- **")) {
                            synonyms.push({
                                quote: lines[0].trim(),
                                word: "",
                                definition: replaceVerseLinks(lines[1].replace(/^\:+|\:+$/g, "").trim(), allverses)
                            });
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

