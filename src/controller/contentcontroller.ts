import {Chapter, Topic} from '../model/model';

export interface ContentController {
  getTopics(withChapters: boolean): Promise<Topic[]>;
  getChapters(topic: Topic): Promise<Chapter[]>;
  getChapterText(chapter: Chapter): Promise<string>;
  deleteTopic(topic: Topic): Promise<void>;
  deleteChapter(chapter: Chapter): Promise<void>;
  renameTopic(topic: Topic, newName: string): Promise<void>;
  renameChapter(chapter: Chapter, newName: string): Promise<void>;
  moveChapter(chapter: Chapter, newTopic: Topic): Promise<void>;
  newTopic(topic: Topic): Promise<void>;
  newChapter(chapter: Chapter, text: string): Promise<void>;
  newChapter(chapter: Chapter, text: string): Promise<void>;
  updateChapter(chapter: Chapter, text: string): Promise<void>;
}
