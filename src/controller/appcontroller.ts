import {ContentViewer as ContentView} from '../view/content';
import {ExplorerView} from '../view/explorer';

export class AppController {
  private explorerView: ExplorerView;
  private contentView: ContentView;
  private navigationView: NavigationView;

  public constructor(
    explorerView: ExplorerView,
    contentView: ContentView,
    navigationView: NavigationView
  ) {
    this.explorerView = explorerView;
    this.contentView = contentView;
    this.navigationView = navigationView;
  }

  public load(): void {
    this.navigationView.addEventListener(
      'newtopicrequested',
      this.createNewTopic
    );
    this.navigationView.addEventListener(
      'newchapterrequested',
      this.createNewChapter
    );
    this.navigationView.addEventListener(
      'deletechapterrequested',
      this.deleteCurrentChapter
    );
    this.navigationView.addEventListener(
      'saverequested',
      this.saveCurrentChapter
    );
    this.navigationView.addEventListener(
      'reloadrequested',
      this.discardAndReloadCurrentChapter
    );
    this.explorerView.addEventListener('chapterselected', e =>
      this.displayChapter((<CustomEvent<Chapter>>e).detail)
    );
    this.explorerView.addEventListener('chapterrenamed', e =>
      this.renameChapter((<CustomEvent<Chapter>>e).detail)
    );
    this.explorerView.addEventListener('topicrenamed', e =>
      this.renameTopic((<CustomEvent<Topic>>e).detail)
    );
  }

  async saveCurrentChapter(): Promise<void> {
    if (editorState.currentChapter !== null) {
      const markdownInputArea = document.getElementById(
        'markdownInput'
      ) as HTMLTextAreaElement;
      await fs.saveChapter(
        editorState.currStoreDirectoryHandle,
        editorState.currentChapter,
        markdownInputArea.value
      );
    }
  }

  initCreate(mode: CreateMode): void {
    editorState.createMode = mode;
  }

  async openStore(): Promise<void> {
    const storeDirectoryHandle = await window.showDirectoryPicker();
    editorState = {
      createMode: CreateMode.TOPIC,
      currStoreDirectoryHandle: storeDirectoryHandle,
      currentChapter: null,
    };
    documentTree.newTopicLink.style.display = 'block';

    const topics = await fs.getTopics(storeDirectoryHandle);
    topics.sort();
    explorer.init(topics);
    await content.setContent('');
  }

  private async displayChapter(chapter: model.Chapter): Promise<void> {
    editorState.currentChapter = chapter;
    explorer.onChapterSelected(chapter);
    if (chapter !== null) {
      const rawText = await fs.getChapterRawText(
        editorState.currStoreDirectoryHandle,
        chapter
      );
      await content.setContent(rawText);
    }

    documentTree.newChapterLink.style.display = 'block';
    documentTree.saveChapterLink.style.display = 'block';
    documentTree.discardChapterLink.style.display = 'block';
  }
}
