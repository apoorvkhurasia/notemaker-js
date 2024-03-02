import * as model from '../model/model';

async function getTopicDirectoryHandle(
  contentRootHandle: FileSystemDirectoryHandle,
  topic: model.Topic
): Promise<FileSystemDirectoryHandle | null> {
  try {
    return contentRootHandle.getDirectoryHandle(topic.getId(), {create: false});
  } catch (err) {
    return null;
  }
}

async function getMetadata(dirHandle: FileSystemDirectoryHandle) {
  try {
    const metadataFileHandle = await dirHandle.getFileHandle('manifest.json', {
      create: false,
    });
    const metadataFile = await metadataFileHandle.getFile();
    const metadataText = await metadataFile.text();
    return JSON.parse(metadataText);
  } catch (err) {
    return null;
  }
}

async function getChapterFileHandle(
  contentRootHandle: FileSystemDirectoryHandle,
  chapter: model.Chapter,
  create: boolean
): Promise<FileSystemFileHandle | null> {
  try {
    const topicHandle = await getTopicDirectoryHandle(
      contentRootHandle,
      chapter.getTopic()
    );
    if (topicHandle === null) {
      return null;
    }
    return topicHandle.getFileHandle(chapter.getId(), {create: create});
  } catch (err) {
    return null;
  }
}

export async function getTopics(
  storeDirectoryHandle: FileSystemDirectoryHandle
): Promise<model.Topic[]> {
  const topics = new Array<model.Topic>();
  for await (const [, handle] of storeDirectoryHandle.entries()) {
    if (handle.kind === 'directory') {
      const metadata = await getMetadata(handle);
      if (
        metadata !== null &&
        metadata.id !== null &&
        metadata.displayName !== null
      ) {
        const topic = new model.Topic(metadata.id, metadata.displayName);
        topics.push(topic);
        for await (const [name, chapterHandle] of handle.entries()) {
          if (name.endsWith('.md') && chapterHandle.kind === 'file') {
            const chp = new model.Chapter(
              name,
              name.substring(0, name.length - 3),
              topic,
              []
            );
            chp.moveTo(topic);
          }
        }
      }
    }
  }
  return topics;
}

export async function getChapterRawText(
  contentRootHandle: FileSystemDirectoryHandle,
  chapter: model.Chapter
): Promise<string> {
  const chapterHandle = await getChapterFileHandle(
    contentRootHandle,
    chapter,
    false
  );
  if (chapterHandle === null) {
    return '';
  }
  const chapterFile = await chapterHandle.getFile();
  const chapterRawText = await chapterFile.text();
  return chapterRawText;
}

export async function createNewTopic(
  contentRootHandle: FileSystemDirectoryHandle,
  topicName: string
): Promise<model.Topic> {
  const topicId = topicName.replaceAll('s+', '-');
  const topicHandle = await contentRootHandle.getDirectoryHandle(topicId, {
    create: true,
  });
  const metadataFileHandle = await topicHandle.getFileHandle('manifest.json', {
    create: true,
  });
  const metadataWritable = await metadataFileHandle.createWritable();
  try {
    const topic = new model.Topic(topicId, topicName);
    await metadataWritable.write(JSON.stringify(topic));
    return topic;
  } finally {
    await metadataWritable.close();
  }
}

export async function createNewChapter(
  contentRootHandle: FileSystemDirectoryHandle,
  topic: model.Topic,
  chapterName: string
): Promise<model.Chapter | null> {
  const chapter = new model.Chapter(chapterName, chapterName, topic, []);
  const chapterHandle = await getChapterFileHandle(
    contentRootHandle,
    chapter,
    true
  );
  if (chapterHandle === null) {
    return null;
  }
  chapter.moveTo(topic);
  return chapter;
}

export async function saveChapter(
  contentRootHandle: FileSystemDirectoryHandle,
  chapter: model.Chapter,
  rawText: string
): Promise<void> {
  const chapterHandle = await getChapterFileHandle(
    contentRootHandle,
    chapter,
    false
  );
  if (chapterHandle !== null) {
    const writable = await chapterHandle.createWritable();
    try {
      await writable.write(rawText);
    } finally {
      await writable.close();
    }
  }
}
