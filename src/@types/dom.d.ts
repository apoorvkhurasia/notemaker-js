import {Chapter, Topic} from '../model/model';
import {ChapterChangeArgs} from '../view/ContentViewer';

declare global {
  interface GlobalEventHandlersEventMap {
    chapterSelected: CustomEvent<Chapter>;
    newTopicRequested: CustomEvent<string>;
    newChapterRequested: CustomEvent<string>;
    inputProvided: CustomEvent<string>;
    inputCancelled: Event;
    topicSelected: CustomEvent<Topic>;
    chapterContentChanged: CustomEvent<ChapterChangeArgs>;
  }
}
export {}; //keep that for TS compiler.
