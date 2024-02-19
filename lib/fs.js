export class Topic {
    constructor(topicKey) {
        this.topicKey = topicKey.replaceAll(".", " ");
        this.displayName = topicKey;
    }
}

export class Chapter {
    constructor(chapterName, topic) {
        this.chapterName = chapterName;
        this.displayName = chapterName.replaceAll(".md", "");
        this.topic = topic;
    }
}

export async function getTopics(contentRootHandle) {
    const topics = [];
    for await (const [name, handle] of contentRootHandle.entries()) {
        if (handle.kind === "directory" && name !== ".") {
            topics.push(new Topic(name));
        }
    }
    return topics;
}

export async function getChapters(contentRootHandle, topic) {
    const chapters = [];
    const topicHandle = await contentRootHandle.getDirectoryHandle(topic.topicKey, { create: false });
    // TODO: Introduce a metadata file later.
    // const manifestHandle = await topicHandle.getFileHandle("manifest.json", { create: false });
    // const manifest = await readFileAsText(manifestHandle.getFile());
    for await (const [name, handle] of topicHandle.entries()) {
        if (handle.kind === "file") {
            chapters.push(new Chapter(name, topic));
        }
    }
    return chapters;
}

export async function getChapterRawText(contentRootHandle, chapter) {
    const topicHandle = await contentRootHandle.getDirectoryHandle(chapter.topic.topicKey);
    const chapterHandle = await topicHandle.getFileHandle(chapter.chapterName);
    const chapterFile = await chapterHandle.getFile();
    const chapterRawText = await chapterFile.text();
    return chapterRawText;
}

