import {Chapter, Topic} from '../model/model';
import {ChapterCreationArgs} from '../view/ContentExplorer';
import {ChapterChangeArgs} from '../view/ContentViewer';

declare global {
  interface GlobalEventHandlersEventMap {
    chapterSelected: CustomEvent<Chapter>;
    newTopicRequested: CustomEvent<string>;
    newChapterRequested: CustomEvent<ChapterCreationArgs>;
    inputProvided: CustomEvent<string>;
    inputCancelled: Event;
    topicSelected: CustomEvent<Topic>;
    chapterContentChanged: CustomEvent<ChapterChangeArgs>;
    showChapterRequestedForm: CustomEvent<Topic>;
  }
}
export {}; //keep that for TS compiler.
