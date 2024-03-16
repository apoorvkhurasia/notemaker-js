import {Chapter, Topic} from '../model/model';

export type StoreCreationOptions = {
  storeName: string;
};

export interface ContentObserver {
  onTopicCreated(topic: Topic): void;
  onTopicRenamed(topic: Topic, newName: string): void;
  onTopicDeleted(topic: Topic): void;
  onChapterCreated(chapter: Chapter): void;
  onChapterMoved(chapter: Chapter, newTopic: Topic): void;
  onChapterRenamed(chapter: Chapter, newName: string): void;
  onChapterDeleted(chapter: Chapter): void;
  onChapterSaved(chapter: Chapter, saveTs: Date): void;
}

export interface ContentController {
  initialiseNewStore(options: StoreCreationOptions): Promise<void>;
  getTopics(withChapters: boolean): Promise<Topic[]>;
  getChapterText(chapter: Chapter): Promise<string>;
  deleteTopic(topic: Topic): Promise<void>;
  deleteChapter(chapter: Chapter): Promise<void>;
  renameTopic(topic: Topic, newName: string): Promise<void>;
  renameChapter(chapter: Chapter, newName: string): Promise<void>;
  moveChapter(chapter: Chapter, newTopic: Topic): Promise<void>;
  newTopic(topic: Topic): Promise<void>;
  newChapter(chapter: Chapter, text: string): Promise<void>;
  newChapter(chapter: Chapter, text: string): Promise<void>;
  saveChapter(chapter: Chapter, text: string): Promise<void>;
  addObserver(obs: ContentObserver): void;
  removeObserver(obs: ContentObserver): void;
}
