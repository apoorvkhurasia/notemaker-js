import {Chapter, Topic} from '../model/model';
import {ExplorerView} from '../view/explorer';

export class ExplorerController {
  private explorerView: ExplorerView;
  private selectedChapter: Chapter | null = null;

  public constructor(explorerView: ExplorerView) {
    this.explorerView = explorerView;
    this.explorerView.addChapterSelectionChangedListener(this);
  }

  public init(topics: Topic[]): void {
    topics.sort();
    this.explorerView.init(topics);
  }

  public onChapterSelected(selectedChapter: Chapter | null) {
    this.selectedChapter = selectedChapter;
  }

  public addChapter(chapter: Chapter) {
    this.explorerView.addChapter(chapter);
    this.explorerView.select;
  }
}
