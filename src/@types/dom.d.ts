import {Chapter, Topic} from '../model/model';
import {ChapterRenameArgs} from '../view/ChapterElement';
import {ChapterCreationArgs} from '../view/ContentExplorer';
import {ChapterChangeArgs} from '../view/ContentViewer';

declare global {
  interface GlobalEventHandlersEventMap {
    selectChapterRequested: CustomEvent<Chapter>;
    selectTopicRequested: CustomEvent<Topic>;
    newTopicRequested: CustomEvent<string>;
    newChapterRequested: CustomEvent<ChapterCreationArgs>;
    deleteTopicRequested: CustomEvent<Topic>;
    deleteChapterRequested: CustomEvent<Chapter>;
    inputProvided: CustomEvent<string>;
    inputCancelled: Event;
    renameChapterRequseted: CustomEvent<ChapterRenameArgs>;
    chapterContentChanged: CustomEvent<ChapterChangeArgs>;
  }
}
export {}; //keep that for TS compiler.
