import {Chapter} from '../model/model';

declare global {
  interface GlobalEventHandlersEventMap {
    chapterselectedevent: CustomEvent<Chapter>;
  }
}
export {}; //keep that for TS compiler.
