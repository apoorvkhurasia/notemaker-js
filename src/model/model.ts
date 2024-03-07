import {del} from '../lib/utils';

export abstract class MonitoredBase<TTrigger, TObserver> {
  private triggers: Array<TTrigger> = [];
  private observers: Array<TObserver> = [];

  public addTrigger(trig: TTrigger): void {
    this.triggers.push(trig);
  }

  public removeTrigger(trig: TTrigger): void {
    const index = this.triggers.indexOf(trig);
    if (index > -1) {
      this.triggers.splice(index, 1);
    }
  }

  public addObserver(obs: TObserver): void {
    this.observers.push(obs);
  }

  public removeObserver(obs: TObserver): void {
    const index = this.observers.indexOf(obs);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  public chainMutation<TField>(
    triggerAction: (trigger: TTrigger, obj: this) => Promise<void>,
    mutation: (obj: this) => void,
    observerAction: (obs: TObserver, obj: this) => Promise<void>
  ) {
    Promise.all(this.triggers.map(t => triggerAction(t, this)))
      .then(() => mutation(this))
      .then(() => {
        this.observers.forEach(obs => observerAction(obs, this));
      });
  }
}

export class Topic extends MonitoredBase<TopicTrigger, TopicObserver> {
  private id: string;
  private displayName: string;
  private chapters: Array<Chapter> = [];

  public constructor(id: string, displayName: string) {
    super();
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
    this.chainMutation(
      (trig: TopicTrigger, topic: Topic) =>
        trig.beforeTopicRename(topic, newName),
      (topic: Topic) => (topic.displayName = newName),
      (obs: TopicObserver, topic: Topic) => obs.afterTopicRename(topic, oldName)
    );
  }

  public addChapter(chapter: Chapter): void {
    if (chapter.getTopic() === this) {
      return;
    }
    const oldTopic = chapter.getTopic();
    chapter.__dangerouslySetBacklink(this);
    if (oldTopic === null) {
      //We are dealing with a brand new chapter
      chapter.chainMutation(
        (t: ChapterTrigger, c: Chapter) => t.beforeChapterCreation(c),
        (c: Chapter) => this.chapters.push(c),
        (obs: ChapterObserver, c: Chapter) => obs.afterChapterCreation(c)
      );
    } else {
      chapter.chainMutation(
        (t: ChapterTrigger, c: Chapter) => t.beforeChapterMove(c, this),
        (c: Chapter) => {
          del<Chapter>(oldTopic.chapters, c);
          this.chapters.push(c);
        },
        (obs: ChapterObserver, c: Chapter) => obs.afterChapterMove(c, oldTopic)
      );
    }
  }

  public removeChapter(chapter: Chapter): void {
    chapter.chainMutation(
      (t: ChapterTrigger, c: Chapter) => t.beforeChapterDeletion(c),
      ((c: Chapter) => {
        del<Chapter>(this.chapters, c);
        c.__dangerouslySetBacklink(null);
      }).bind(this),
      (obs: ChapterObserver, c: Chapter) => obs.afterChapterDeletion(c)
    );
  }

  public getChapters(): Array<Chapter> {
    return this.chapters;
  }

  public delete(): void {
    this.chainMutation(
      (t: TopicTrigger, topic: Topic) => t.beforeTopicDeletion(topic),
      (topic: Topic) => {
        topic.chapters.forEach(c => topic.removeChapter(c));
      },
      (o: TopicObserver, topic: Topic) => o.afterTopicDeletion(topic)
    );
  }

  public checksum(): string {
    return (
      this.getId() +
      '-' +
      this.chapters
        .map(c => c.getId())
        .toSorted()
        .reduce((id1, id2) => id1 + '-' + id2, '')
    );
  }
}

export class Chapter extends MonitoredBase<ChapterTrigger, ChapterObserver> {
  private id: string;
  private displayName: string;
  private topic: Topic | null = null; //backlink

  public constructor(id: string, displayName: string) {
    super();
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
    this.chainMutation(
      (trig: ChapterTrigger, chapter: Chapter) =>
        trig.beforeChapterRename(chapter, newName),
      (chapter: Chapter) => (chapter.displayName = newName),
      (obs: ChapterObserver, chapter: Chapter) =>
        obs.afterChapterRenamed(chapter, oldName)
    );
  }

  public getTopic(): Topic | null {
    return this.topic;
  }

  public __dangerouslySetBacklink(topic: Topic | null): void {
    this.topic = topic;
  }
}

export interface ChapterTrigger {
  beforeChapterCreation(chapter: Chapter): Promise<void>;
  beforeChapterMove(chapter: Chapter, newTopic: Topic): Promise<void>;
  beforeChapterRename(chapter: Chapter, oldName: string): Promise<void>;
  beforeChapterDeletion(chapter: Chapter): Promise<void>;
}

export interface ChapterObserver {
  afterChapterCreation(chapter: Chapter): Promise<void>;
  afterChapterMove(chapter: Chapter, oldTopic: Topic): Promise<void>;
  afterChapterRenamed(chapter: Chapter, oldName: string): Promise<void>;
  afterChapterDeletion(chapter: Chapter): Promise<void>;
}

export interface TopicTrigger {
  beforeTopicDeletion(topic: Topic): Promise<void>;
  beforeTopicRename(topic: Topic, newName: string): Promise<void>;
}

export interface TopicObserver {
  afterTopicDeletion(topic: Topic): Promise<void>;
  afterTopicRename(topic: Topic, oldName: string): Promise<void>;
}
