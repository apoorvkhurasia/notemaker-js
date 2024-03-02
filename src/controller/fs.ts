import { Chapter, Topic } from '../model/model';
import { ContentController } from './contentcontroller';

export class FileSystemController implements ContentController {

  private contentRootHandle: FileSystemDirectoryHandle;

  public constructor(contentRootHandle: FileSystemDirectoryHandle) {
    this.contentRootHandle = contentRootHandle;
  }

  public async getTopics(withChapters: boolean): Promise<Topic[]> {
    const topics = new Array<Topic>();
    for await (const [, handle] of this.contentRootHandle.entries()) {
      if (handle.kind === 'directory') {
        const metadata = await this.getTopicMetadata(handle);
        if (
          metadata !== null &&
          metadata.id !== null &&
          metadata.displayName !== null
        ) {
          const topic = new Topic(metadata.id, metadata.displayName);
          if (withChapters) {
            (await this.getChapters(topic)).forEach(chp => topic.addChapter(chp));
          }
          topics.push(topic);
        }
      }
    }
    return topics;
  }

  public async getChapters(topic: Topic): Promise<Chapter[]> {
    const handle = await this.getTopicDirectoryHandle(topic);
    const chapters = new Array<Chapter>();
    if (handle == null) {
      return chapters;
    }
    for await (const [name, chapterHandle] of handle.entries()) {
      if (name.endsWith('.md') && chapterHandle.kind === 'file') {
        chapters.push(new Chapter(
          name,
          name.substring(0, name.length - 3)
        ));
      }
    }
    return chapters;
  }

  public async getChapterText(chapter: Chapter): Promise<string> {
    const chapterHandle = await this.getChapterFileHandle(
      chapter,
      false
    );
    if (chapterHandle === null) {
      return '';
    }
    const chapterFile = await chapterHandle.getFile();
    return await chapterFile.text();
  }

  public async deleteTopic(topic: Topic): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async deleteChapter(chapter: Chapter): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async renameTopic(topic: Topic, newName: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async renameChapter(chapter: Chapter, newName: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async moveChapter(chapter: Chapter, newTopic: Topic): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async newTopic(topic: Topic): Promise<void> {
    const topicId = topic.getId();
    const topicHandle = await this.contentRootHandle.getDirectoryHandle(topicId, {
      create: true,
    });
    const metadataFileHandle = await topicHandle.getFileHandle('manifest.json', {
      create: true,
    });
    const metadataWritable = await metadataFileHandle.createWritable();
    try {
      await metadataWritable.write(JSON.stringify(topic));
    } finally {
      await metadataWritable.close();
    }
  }

  public async newChapter(chapter: Chapter, text: string): Promise<void> {
    this.createOrUpdateChapter(chapter, text, true);
  }

  public async updateChapter(chapter: Chapter, text: string): Promise<void> {
    this.createOrUpdateChapter(chapter, text, false);
  }

  private async createOrUpdateChapter(chapter: Chapter, text: string, create: boolean): Promise<void> {
    const chapterHandle = await this.getChapterFileHandle(
      chapter,
      create
    );
    if (chapterHandle !== null && text.length > 0) {
      const chapterWritable = await chapterHandle.createWritable();
      try {
        await chapterWritable.write(text);
      } finally {
        await chapterWritable.close();
      }
    }
  }

  private async getTopicMetadata(dirHandle: FileSystemDirectoryHandle) {
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

  private async getChapterFileHandle(
    chapter: Chapter,
    create: boolean
  ): Promise<FileSystemFileHandle | null> {
    const topic = chapter.getTopic();
    if (topic === null) {
      return null;
    }
    try {
      const topicHandle = await this.getTopicDirectoryHandle(topic);
      if (topicHandle === null) {
        return null;
      }
      return topicHandle.getFileHandle(chapter.getId(), { create: create });
    } catch (err) {
      return null;
    }
  }

  private async getTopicDirectoryHandle(
    topic: Topic
  ): Promise<FileSystemDirectoryHandle | null> {
    try {
      return this.contentRootHandle.getDirectoryHandle(topic.getId(), { create: false });
    } catch (err) {
      return null;
    }
  }

}
