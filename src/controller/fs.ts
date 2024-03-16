import {del} from '../lib/utils';
import {Chapter, Topic} from '../model/model';
import {
  ContentController,
  ContentObserver,
  StoreCreationOptions,
} from './contentcontroller';

type ChapterShell = {
  id: string;
  displayName: string;
};

type TopicShell = {
  id: string;
  displayName: string;
  chapters: ChapterShell[];
};

type StoreMetadata = {
  id: string;
  displayName: string;
  topics: TopicShell[];
};

export class FileSystemController implements ContentController {
  private contentRootHandle: FileSystemDirectoryHandle;
  private observers: ContentObserver[] = [];
  private metadata: StoreMetadata | null = null;

  public constructor(contentRootHandle: FileSystemDirectoryHandle) {
    this.contentRootHandle = contentRootHandle;
  }

  private async getMetadata(): Promise<StoreMetadata> {
    let metadata = this.metadata;
    if (metadata === null) {
      metadata = await this.getMetadataFromFile();
    }
    if (metadata === null) {
      metadata = {
        id: crypto.randomUUID(),
        displayName: 'My first notebook',
        topics: [],
      };
    }
    this.metadata = metadata;
    return metadata;
  }

  public async initialiseNewStore(
    options: StoreCreationOptions
  ): Promise<void> {
    this.metadata = {
      id: crypto.randomUUID(),
      displayName: options.storeName,
      topics: [],
    };
    await this.writeMetadataToFile();
  }

  public addObserver(obs: ContentObserver): void {
    const index = this.observers.indexOf(obs);
    if (index <= 0) {
      this.observers.push(obs);
    }
  }

  public removeObserver(obs: ContentObserver): void {
    del<ContentObserver>(this.observers, obs);
  }

  public async getTopics(): Promise<Topic[]> {
    const topics = new Array<Topic>();
    const metadata = await this.getMetadata();
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
    const remainingTopics = new Array<TopicShell>();
    for (const t of metadata.topics) {
      if (t.id !== topic.getId()) {
        remainingTopics.push(t);
      } else {
        for (const c of topic.getChapters()) {
          await this.deleteChapter(c);
        }
      }
    }
    metadata.topics = remainingTopics;
    this.writeMetadataToFile();
    this.observers.forEach(obs => obs.onTopicDeleted(topic));
  }

  public async deleteChapter(chapter: Chapter): Promise<void> {
    try {
      const topic = chapter.getTopic();
      if (topic === null) {
        return;
      }
      const metadata = await this.getMetadata();
      for (const topicShell of metadata.topics) {
        if (topicShell.id === topic.getId()) {
          topicShell.chapters = topicShell.chapters.filter(
            c => c.id !== chapter.getId()
          );
          break;
        }
      }
      this.writeMetadataToFile();
      await this.contentRootHandle.removeEntry(
        FileSystemController.getChapterFileName(chapter)
      );
      this.observers.forEach(obs => obs.onChapterDeleted(chapter));
    } catch (err) {
      console.log('Error deleting chapter');
      console.log(err);
    }
  }

  public async renameTopic(topic: Topic, newName: string): Promise<void> {
    const metadata = await this.getMetadata();
    for (const topicShell of metadata.topics) {
      if (topicShell.id === topic.getId()) {
        topicShell.displayName = newName;
      }
      break;
    }
    await this.writeMetadataToFile();
    this.observers.forEach(obs => obs.onTopicRenamed(topic, newName));
  }

  public async renameChapter(chapter: Chapter, newName: string): Promise<void> {
    const topic = chapter.getTopic();
    if (topic === null) {
      return; //TODO: Handle orphan nodes later
    }
    const metadata = await this.getMetadata();
    for (const topicShell of metadata.topics) {
      if (topicShell.id === topic.getId()) {
        for (const chapter of topicShell.chapters) {
          chapter.displayName = newName;
          break;
        }
        break;
      }
    }
    await this.writeMetadataToFile();
    this.observers.forEach(obs => obs.onChapterRenamed(chapter, newName));
  }

  public async moveChapter(chapter: Chapter, newTopic: Topic): Promise<void> {
    const metadata = await this.getMetadata();
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
    await this.writeMetadataToFile();
    this.observers.forEach(obs => obs.onChapterMoved(chapter, newTopic));
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
    await this.writeMetadataToFile();
    this.observers.forEach(obs => obs.onTopicCreated(topic));
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
    await this.writeMetadataToFile();
    this.observers.forEach(obs => obs.onChapterCreated(chapter));
  }

  public async saveChapter(chapter: Chapter, text: string): Promise<void> {
    const saveTs = new Date();
    this.createOrUpdateChapter(chapter, text, false);
    this.observers.forEach(obs => obs.onChapterSaved(chapter, saveTs));
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

  private async getMetadataFromFile(): Promise<StoreMetadata | null> {
    try {
      const metadataFileHandle = await this.contentRootHandle.getFileHandle(
        'manifest.json',
        {
          create: false,
        }
      );
      if (!metadataFileHandle) {
        return null;
      }
      const metadataFile = await metadataFileHandle.getFile();
      const metadataText = await metadataFile.text();
      return <StoreMetadata>JSON.parse(metadataText);
    } catch (_err) {
      return null;
    }
  }

  private async writeMetadataToFile(): Promise<void> {
    const metadata = await this.getMetadata();
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
      return this.contentRootHandle.getFileHandle(
        FileSystemController.getChapterFileName(chapter),
        {
          create: create,
        }
      );
    } catch (_err) {
      return null;
    }
  }

  private static getChapterFileName(chapter: Chapter): string {
    return chapter.getId() + '.md';
  }
}
