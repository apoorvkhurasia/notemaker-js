import {Chapter, Topic} from '../model/model';
import {ContentController} from './contentcontroller';

export type ChapterShell = {
  id: string;
  displayName: string;
};

export type TopicShell = {
  id: string;
  displayName: string;
  chapters: ChapterShell[];
};

export type StoreMetadata = {
  id: string;
  displayName: string;
  topics: TopicShell[];
};

export class FileSystemController implements ContentController {
  private contentRootHandle: FileSystemDirectoryHandle;

  public constructor(contentRootHandle: FileSystemDirectoryHandle) {
    this.contentRootHandle = contentRootHandle;
  }

  public async getTopics(): Promise<Topic[]> {
    const topics = new Array<Topic>();
    const metadata = await this.getMetadata();
    if (metadata === null) {
      //TODO: Handle orphan nodes later
      return topics;
    }
    for (const topicShell of metadata.topics) {
      const topic = new Topic(topicShell.id, topicShell.displayName);
      for (const chapterShell of topicShell.chapters) {
        topic.addChapter(
          new Chapter(chapterShell.id, chapterShell.displayName)
        );
      }
      topics.push(topic);
    }
    return topics;
  }

  public async getChapterText(chapter: Chapter): Promise<string> {
    const chapterHandle = await this.getChapterFileHandle(chapter, false);
    if (chapterHandle === null) {
      return ''; //TODO: Handle missing chapter content with a warning icon later
    }
    return await (await chapterHandle.getFile()).text();
  }

  public async deleteTopic(topic: Topic): Promise<void> {
    const metadata = await this.getMetadata();
    if (metadata === null) {
      return;
    }
    metadata.topics = metadata.topics.filter(t => t.id !== topic.getId());
    this.writeMetadata(metadata);
  }

  public async deleteChapter(chapter: Chapter): Promise<void> {
    await this.contentRootHandle.removeEntry(chapter.getId());
    const topic = chapter.getTopic();
    if (topic === null) {
      return;
    }
    const metadata = await this.getMetadata();
    if (metadata !== null) {
      for (const topicShell of metadata.topics) {
        if (topicShell.id === topic.getId()) {
          topicShell.chapters = topicShell.chapters.filter(
            c => c.id === chapter.getId()
          );
          break;
        }
      }
      await this.writeMetadata(metadata);
    }
  }

  public async renameTopic(topic: Topic, newName: string): Promise<void> {
    const metadata = await this.getMetadata();
    if (metadata !== null) {
      for (const topicShell of metadata.topics) {
        topicShell.displayName = newName;
        break;
      }
      await this.writeMetadata(metadata);
    }
  }

  public async renameChapter(chapter: Chapter, newName: string): Promise<void> {
    const topic = chapter.getTopic();
    if (topic === null) {
      return; //TODO: Handle orphan nodes later
    }
    const metadata = await this.getMetadata();
    if (metadata === null) {
      return;
    }
    for (const topicShell of metadata.topics) {
      if (topicShell.id === topic.getId()) {
        for (const chapter of topicShell.chapters) {
          chapter.displayName = newName;
          break;
        }
      }
      break;
    }
    await this.writeMetadata(metadata);
  }

  public async moveChapter(chapter: Chapter, newTopic: Topic): Promise<void> {
    const metadata = await this.getMetadata();
    if (metadata === null) {
      return;
    }

    const oldTopic = chapter.getTopic();
    for (const topicShell of metadata.topics) {
      if (oldTopic !== null && topicShell.id === oldTopic.getId()) {
        topicShell.chapters = topicShell.chapters.filter(
          c => c.id === chapter.getId()
        );
      } else if (topicShell.id === newTopic.getId()) {
        topicShell.chapters.push({
          id: chapter.getId(),
          displayName: chapter.getDisplayName(),
        });
      }
    }
    await this.writeMetadata(metadata);
  }

  public async newTopic(topic: Topic): Promise<void> {
    const metadata = await this.getMetadata();
    if (metadata === null) {
      return;
    }
    metadata.topics.push({
      id: topic.getId(),
      displayName: topic.getDisplayName(),
      chapters: [],
    });
    await this.writeMetadata(metadata);
  }

  public async newChapter(chapter: Chapter, text: string): Promise<void> {
    const topic = chapter.getTopic();
    if (topic === null) {
      return;
    }
    this.createOrUpdateChapter(chapter, text, true);
    const metadata = await this.getMetadata();
    if (metadata === null) {
      return;
    }
    for (const topicShell of metadata.topics) {
      if (topicShell.id === topic.getId()) {
        topicShell.chapters.push({
          id: chapter.getId(),
          displayName: chapter.getDisplayName(),
        });
        break;
      }
    }
    await this.writeMetadata(metadata);
  }

  public async saveChapter(chapter: Chapter, text: string): Promise<void> {
    this.createOrUpdateChapter(chapter, text, false);
  }

  private async createOrUpdateChapter(
    chapter: Chapter,
    text: string,
    create: boolean
  ): Promise<void> {
    const chapterHandle = await this.getChapterFileHandle(chapter, create);
    if (chapterHandle !== null) {
      const chapterWritable = await chapterHandle.createWritable();
      try {
        await chapterWritable.write(text);
      } finally {
        await chapterWritable.close();
      }
    }
  }

  private async getMetadata(): Promise<StoreMetadata | null> {
    try {
      const metadataFileHandle = await this.contentRootHandle.getFileHandle(
        'manifest.json',
        {
          create: false,
        }
      );
      const metadataFile = await metadataFileHandle.getFile();
      const metadataText = await metadataFile.text();
      return <StoreMetadata>JSON.parse(metadataText);
    } catch (err) {
      return null;
    }
  }

  private async writeMetadata(metadata: StoreMetadata): Promise<void> {
    const metadataFileHandle = await this.contentRootHandle.getFileHandle(
      'manifest.json',
      {
        create: true,
      }
    );
    const metadataWritable = await metadataFileHandle.createWritable();
    try {
      await metadataWritable.write(JSON.stringify(metadata));
    } finally {
      await metadataWritable.close();
    }
  }

  private async getChapterFileHandle(
    chapter: Chapter,
    create: boolean
  ): Promise<FileSystemFileHandle | null> {
    try {
      return this.contentRootHandle.getFileHandle(chapter.getId() + '.md', {
        create: create,
      });
    } catch (err) {
      return null;
    }
  }
}
