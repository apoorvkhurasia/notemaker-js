import {del} from '../lib/utils';

export class Topic {
  private id: string;
  private displayName: string;
  private chapters: Array<Chapter> = [];

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
    this.displayName = newName;
  }

  public addChapter(chapter: Chapter): void {
    if (chapter.getTopic() === this) {
      return;
    }
    const oldTopic = chapter.getTopic();
    chapter.__dangerouslySetBacklink(this);
    this.chapters.push(chapter);
    if (oldTopic !== null) {
      del<Chapter>(oldTopic.chapters, chapter);
    }
  }

  public removeChapter(chapter: Chapter): void {
    if (del<Chapter>(this.chapters, chapter)) {
      chapter.__dangerouslySetBacklink(null);
    }
  }

  public getChapters(): Array<Chapter> {
    return this.chapters;
  }
}

export class Chapter {
  private id: string;
  private displayName: string;
  private topic: Topic | null = null; //backlink

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
    this.displayName = newName;
  }

  public getTopic(): Topic | null {
    return this.topic;
  }

  public __dangerouslySetBacklink(topic: Topic | null): void {
    this.topic = topic;
  }
}
