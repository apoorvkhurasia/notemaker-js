export class Topic {
  private id: string;
  private displayName: string;
  private chapters: Array<Chapter> = [];
  private observers: Array<TopicObserver> = [];

  public constructor(id: string, displayName: string) {
    this.id = id;
    this.displayName = displayName;
  }

  public getId(): string {
    return this.id;
  }

  public getDisplayName(): string {
    return this.displayName;
  }

  public setDisplayName(newName: string): void {
    const oldName = this.displayName;
    this.displayName = newName;
    this.observers.forEach(obs => obs.onTopicRenamed(this, oldName));
  }

  public addChapter(chapter: Chapter): void {
    if (chapter.getTopic() === this) {
      return;
    }
    const oldTopic = chapter.getTopic();
    if (oldTopic !== null) {
      oldTopic.removeChapter(chapter);
    }
    this.chapters.push(chapter);
    chapter.__dangerouslySetBacklink(this);
    this.observers.forEach(obs => obs.onChapterMove(chapter, oldTopic));
  }

  public removeChapter(chapter: Chapter): void {
    const index = this.chapters.indexOf(chapter);
    if (index > -1) {
      this.chapters.splice(index, 1);
      chapter.__dangerouslySetBacklink(null);
      this.observers.forEach(obs => obs.onChapterMove(chapter, this));
    }
  }

  public getChapters(): Array<Chapter> {
    return this.chapters;
  }

  public addObserver(obs: TopicObserver): void {
    this.observers.push(obs);
  }

  public removeObserver(obs: TopicObserver): void {
    const index = this.observers.indexOf(obs);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  public delete(): void {
    let chapterToRemove = this.chapters.pop();
    while (chapterToRemove) {
      this.removeChapter(chapterToRemove);
      chapterToRemove = this.chapters.pop();
    }
    this.observers.forEach(obs => obs.onTopicDeleted(this));
    this.observers.splice(0, this.observers.length);
  }
}

export class Chapter {
  private id: string;
  private displayName: string;
  private topic: Topic | null = null; //backlink
  private observers: Array<ChapterObserver> = [];

  public constructor(id: string, displayName: string) {
    this.id = id;
    this.displayName = displayName;
  }

  public getId(): string {
    return this.id;
  }

  public getDisplayName(): string {
    return this.displayName;
  }

  public setDisplayName(newName: string): void {
    const oldName = this.displayName;
    this.displayName = newName;
    this.observers.forEach(obs => obs.onChapterRenamed(this, oldName));
  }

  public getTopic(): Topic | null {
    return this.topic;
  }

  public __dangerouslySetBacklink(topic: Topic | null): void {
    this.topic = topic;
  }

  public addObserver(obs: ChapterObserver): void {
    this.observers.push(obs);
  }

  public removeObserver(obs: ChapterObserver): void {
    const index = this.observers.indexOf(obs);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }
}

export interface ChapterObserver {
  onChapterRenamed(chapter: Chapter, oldName: string): void;
}

export interface TopicObserver {
  onTopicCreated(topic: Topic): void;
  onTopicDeleted(topic: Topic): void;
  onTopicRenamed(topic: Topic, oldName: string): void;
  onChapterCreated(chapter: Chapter): void;
  onChapterMove(chapter: Chapter, oldTOpic: Topic | null): void;
  onChapterDeleted(chapter: Chapter): void;
}
