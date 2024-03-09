import {Chapter, Topic} from '../model/model';

declare global {
  interface GlobalEventHandlersEventMap {
    chapterSelected: CustomEvent<Chapter>;
    newTopicRequested: CustomEvent<string>;
    newChapterRequested: CustomEvent<string>;
    inputProvided: CustomEvent<string>;
    inputCancelled: Event;
    topicSelected: CustomEvent<Topic>;
    chapterContentChanged: CustomEvent<Chapter>;
  }
}
export {}; //keep that for TS compiler.
