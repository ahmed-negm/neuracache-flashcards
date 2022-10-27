import * as fs from "fs-extra";
import * as glob from "glob";

export const zcPath = process.env.zcPath!;
export const neuraCachePath = process.env.neuraCachePath!;

export interface IVerse {
    link: string;
    ayah: string;
}

export async function getMarkdownFiles(dir: string): Promise<string[]> {
    const globOptions = { cwd: dir, ignore: ["Quran/**/*"] };
    return new Promise<string[]>((resolve, reject) =>
        glob("**/*.md", globOptions, (err: any, matches: any) => (err ? reject(err) : resolve(matches)))
    );
}

export function getAllverses() {
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

export function replaceVerseLinks(definition: string, allverses: IVerse[]) {
    for (const verse of allverses) {
        definition = definition.replace(verse.link, `"${verse.ayah}" ${verse.link}`);
    }

    return definition;
}

export function getMetadataValue(content: string, metadataName: string) {
    const metadataLine = `\n${metadataName}:`;
    const valueIndex = content.indexOf(metadataLine);

    return valueIndex > -1
        ? content.substring(valueIndex + metadataLine.length, content.indexOf(`\n`, valueIndex + metadataLine.length))
        : undefined;
}

export function getTags(content: string, metadataName: string) {
    const metadataValue = getMetadataValue(content, metadataName);
    if (metadataValue) {
        return metadataValue
            .split(" ")
            .map(tag => tag.trim())
            .filter(tag => !!tag);
    } else {
        return [];
    }
}
