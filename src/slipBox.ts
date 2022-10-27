import * as path from "path";
import * as fs from "fs-extra";

import { getTags, IVerse, neuraCachePath, replaceVerseLinks, zcPath } from "./utils";

interface INote {
    content: string;
    tags: string[];
}

export async function generateSlipBox(allFiles: string[], allverses: IVerse[]) {
    await fs.rm(path.join(neuraCachePath, "slip-box"), { recursive: true, force: true });

    const slipBoxFiles = allFiles.filter(file => file.indexOf("SLIP-BOX/") > -1);

    const notes: INote[] = [];
    for (const file of slipBoxFiles) {
        const content = await fs.readFile(path.join(zcPath, file), "utf-8");
        notes.push({
            content: replaceVerseLinks(content.split("---").slice(2).join("---").replace("# ", "").trim(), allverses),
            tags: getTags(content, "tags")
        });
    }

    const neuraCacheContent = notes
        .map(note => `#spaced ${note.tags.map(tag => `#${tag}`).join(" ")}\n${note.content}\n- - -`)
        .join("\n\n");

    fs.outputFile(path.join(neuraCachePath, "slip-box", "notes.md"), neuraCacheContent);
}
