import * as model from "./model";

async function getTopicDirectoryHandle(contentRootHandle: FileSystemDirectoryHandle,
    topic: model.Topic): Promise<FileSystemDirectoryHandle> {
    try {
        return contentRootHandle.getDirectoryHandle(topic.getId(), { create: false });
    } catch (err) {
        return null;
    }
}

async function getMetadata(dirHandle: FileSystemDirectoryHandle) {
    try {
        const metadataFileHandle = await dirHandle.getFileHandle("manifest.json", { create: false });
        const metadataFile = await metadataFileHandle.getFile();
        const metadataText = await metadataFile.text();
        return JSON.parse(metadataText);
    } catch (err) {
        return null;
    }
}

async function getChapterFileHandle(contentRootHandle: FileSystemDirectoryHandle,
    chapter: model.Chapter, create: boolean): Promise<FileSystemFileHandle> {
    try {
        const topicHandle = await getTopicDirectoryHandle(contentRootHandle, chapter.getTopic());
        if (topicHandle === null) {
            return null;
        }
        return topicHandle.getFileHandle(chapter.getId(), { create: create });
    } catch (err) {
        return null;
    }
}

export async function getTopics(storeDirectoryHandle: FileSystemDirectoryHandle): Promise<model.Topic[]> {
    const topics = new Array<model.Topic>();
    for await (const [, handle] of storeDirectoryHandle.entries()) {
        if (handle.kind === "directory") {
            const metadata = await getMetadata(handle);
            if (metadata) {
                const topic = new model.Topic(
                    metadata.id,
                    metadata.displayName);
                topics.push(topic);
                for await (const [name, chapterHandle] of handle.entries()) {
                    if (name.endsWith(".md") && chapterHandle.kind === "file") {
                        const chp = new model.Chapter(name, name.substring(0, name.length - 3), []);
                        chp.moveTo(topic);
                    }
                }
            }
        }
    }
    return topics;
}

export async function getChapterRawText(contentRootHandle: FileSystemDirectoryHandle,
    chapter: model.Chapter): Promise<string> {
    const chapterHandle = await getChapterFileHandle(contentRootHandle, chapter, false);
    const chapterFile = await chapterHandle.getFile();
    const chapterRawText = await chapterFile.text();
    return chapterRawText;
}

export async function createNewTopic(contentRootHandle: FileSystemDirectoryHandle,
    topicName: string): Promise<model.Topic> {
    const topicHandle = await contentRootHandle.getDirectoryHandle(topicName, { create: true });
    const metadataFileHandle = await topicHandle.getFileHandle("manifest.json", { create: true });
    const metadataWritable = await metadataFileHandle.createWritable();
    try {

        const topic = new model.Topic(topicName, topicName);
        await metadataWritable.write(JSON.stringify(topic));
        return topic;
    } finally {
        await metadataWritable.close();
    }
}

export async function createNewChapter(contentRootHandle: FileSystemDirectoryHandle,
    topic: model.Topic, chapterName: string): Promise<model.Chapter> {
    const chapter = new model.Chapter(chapterName, chapterName, []);
    const chapterHandle = await getChapterFileHandle(contentRootHandle, chapter, true);
    if (chapterHandle === null) {
        return null;
    }
    chapter.moveTo(topic);
    return chapter;
}