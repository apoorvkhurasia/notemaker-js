import React, {createRef} from 'react';
import {ChapterChangeArgs, ContentViewer} from './ContentViewer';
import {Chapter, Topic} from '../model/model';
import {
  ContentController,
  ContentObserver,
  StoreCreationOptions,
} from '../controller/contentcontroller';
import {FileSystemController} from '../controller/fs';
import {ChapterCreationArgs, ContentExplorer} from './ContentExplorer';
import {ChapterRenameArgs} from './ChapterElement';
import {ButtonlessForm} from './ButtonlessForm';
import ReactDOM from 'react-dom';

export interface AppState {
  contentController: ContentController | null;
  askStoreName: boolean;
  topics: Topic[];
  selectedTopic: Topic | null;
  selectedChapter: Chapter | null;
  rawMarkdownText: string;
  caretPos: number;
  editorVisible: boolean;
  previewVisible: boolean;
  lastSaveTs: Date | null;
}

export class App
  extends React.Component<{}, AppState>
  implements ContentObserver
{
  private unsavedChapters = new Map<string, ChapterChangeArgs>();
  private storeNameInput: React.RefObject<ButtonlessForm>;
  private static readonly SAVE_INTERVAL = 2000;

  public constructor(props: {}) {
    super(props);
    this.storeNameInput = createRef();
    this.state = {
      contentController: null,
      askStoreName: false,
      topics: [],
      selectedTopic: null,
      selectedChapter: null,
      rawMarkdownText: '',
      caretPos: 0,
      editorVisible: true,
      previewVisible: true,
      lastSaveTs: null,
    };
  }

  componentDidMount(): void {
    document.addEventListener('chapterSelected', this.loadChapter.bind(this));
    document.addEventListener(
      'newTopicRequested',
      this.createNewTopic.bind(this)
    );
    document.addEventListener(
      'newChapterRequested',
      this.createNewChapter.bind(this)
    );
    document.addEventListener(
      'chapterContentChanged',
      this.chapterContentChanged.bind(this)
    );
    document.addEventListener(
      'renameChapterRequseted',
      this.renameChapterRequseted.bind(this)
    );
    const topicInputElem = ReactDOM.findDOMNode(
      this.storeNameInput.current
    ) as HTMLElement;
    if (topicInputElem) {
      topicInputElem.addEventListener(
        'inputProvided',
        this.createStore.bind(this)
      );
      topicInputElem.addEventListener(
        'inputCancelled',
        this.cancelCreatingStore.bind(this)
      );
    }
  }

  componentWillUnmount(): void {
    clearTimeout(this.saveUnsavedChapters());
    document.removeEventListener(
      'chapterSelected',
      this.loadChapter.bind(this)
    );
    document.removeEventListener(
      'newTopicRequested',
      this.createNewTopic.bind(this)
    );
    document.removeEventListener(
      'newChapterRequested',
      this.createNewChapter.bind(this)
    );
    document.removeEventListener(
      'chapterContentChanged',
      this.chapterContentChanged.bind(this)
    );
    document.removeEventListener(
      'renameChapterRequseted',
      this.renameChapterRequseted.bind(this)
    );
    const topicInputElem = ReactDOM.findDOMNode(
      this.storeNameInput.current
    ) as HTMLElement;
    if (topicInputElem) {
      topicInputElem.removeEventListener(
        'inputProvided',
        this.createStore.bind(this)
      );
      topicInputElem.removeEventListener(
        'inputCancelled',
        this.cancelCreatingStore.bind(this)
      );
    }
  }

  public render() {
    return (
      <>
        <nav className="topmenu" style={{width: '100%'}}>
          <ul>
            <li>
              <a
                className="material-symbols-outlined"
                onClick={(() => this.setState({askStoreName: true})).bind(this)}
              >
                create_new_folder
              </a>
            </li>
            <li
              style={{
                display: this.state.askStoreName ? 'inline-block' : 'none',
              }}
            >
              <ButtonlessForm
                promptText="Enter store name"
                ref={this.storeNameInput}
              />
            </li>
            <li>
              <a
                className="material-symbols-outlined"
                onClick={this.openStore.bind(this)}
              >
                folder_open
              </a>
            </li>
            <li>
              <a
                className="material-symbols-outlined"
                onClick={this.togglePreview.bind(this)}
              >
                {this.state.previewVisible ? 'preview_off' : 'preview'}
              </a>
            </li>
            <li>
              <a
                className="material-symbols-outlined"
                onClick={this.toggleEditorVisibility.bind(this)}
              >
                {this.state.editorVisible ? 'edit_off' : 'edit'}
              </a>
            </li>
          </ul>
        </nav>
        {this.state.contentController ? (
          <>
            <ContentExplorer topics={this.state.topics} />
            <ContentViewer
              selectedChapter={this.state.selectedChapter}
              caretPos={this.state.caretPos}
              editorVisible={this.state.editorVisible}
              previewVisible={this.state.previewVisible}
              originalRawMarkdownText={this.state.rawMarkdownText}
            />
          </>
        ) : (
          <div className="init-message-screen">
            <div className="init-message">
              Create a new store or Open a new store
            </div>
          </div>
        )}
        <div className="footer">
          {this.state.lastSaveTs && (
            <label>Autosaved: {this.state.lastSaveTs.toLocaleString()}</label>
          )}
          <label style={{float: 'right'}}>md</label>
        </div>
      </>
    );
  }

  private togglePreview(): void {
    this.setState({previewVisible: !this.state.previewVisible});
  }

  private toggleEditorVisibility(): void {
    this.setState({editorVisible: !this.state.editorVisible});
  }

  private async createStore(e: CustomEvent<string>): Promise<void> {
    await this.createOrOpenStore({storeName: e.detail.trim()});
    this.setState({askStoreName: false});
  }

  private cancelCreatingStore(): void {
    this.setState({askStoreName: false});
  }

  private async openStore(): Promise<void> {
    await this.createOrOpenStore(null);
  }

  private async createOrOpenStore(
    options: StoreCreationOptions | null
  ): Promise<void> {
    clearTimeout(this.saveUnsavedChapters());
    this.state.contentController?.removeObserver(this);

    try {
      const storeDirectoryHandle = await window.showDirectoryPicker();
      if (storeDirectoryHandle) {
        const contentController = new FileSystemController(
          storeDirectoryHandle
        );
        if (options) {
          contentController.initialiseNewStore(options);
        }
        const newTopics = await contentController.getTopics();
        this.setState({
          contentController: contentController,
          topics: newTopics,
          selectedChapter: null,
          selectedTopic: null,
        });
        contentController.addObserver(this);
      }
    } catch (_err) {
      this.state.contentController?.addObserver(this);
      this.saveUnsavedChapters();
    }
  }

  private async loadChapter(e: CustomEvent<Chapter>): Promise<void> {
    clearTimeout(this.saveUnsavedChapters());
    const controller = this.state.contentController;
    if (controller) {
      const chapter = e.detail as Chapter;
      const rawText = await controller.getChapterText(chapter);
      this.setState({
        selectedTopic: chapter.getTopic(),
        selectedChapter: chapter,
        rawMarkdownText: rawText,
        lastSaveTs: null,
      });
      this.saveUnsavedChapters();
    }
  }

  private chapterContentChanged(e: CustomEvent<ChapterChangeArgs>): void {
    this.unsavedChapters.set(e.detail.chapter.getId(), e.detail);
  }

  private saveUnsavedChapters(): NodeJS.Timeout {
    const controller = this.state.contentController;
    if (controller) {
      for (const [, args] of this.unsavedChapters.entries()) {
        controller.saveChapter(args.chapter, args.rawMarkdownText).then(() => {
          if (args.chapter === this.state.selectedChapter) {
            this.setState({lastSaveTs: new Date()});
          }
        });
      }
    }
    this.unsavedChapters.clear();
    return setTimeout(this.saveUnsavedChapters.bind(this), App.SAVE_INTERVAL);
  }

  private async createNewTopic(e: CustomEvent<string>): Promise<void> {
    const controller = this.state.contentController;
    if (controller) {
      const topic = new Topic(crypto.randomUUID(), e.detail);
      await controller.newTopic(topic);
    }
  }

  private async createNewChapter(
    e: CustomEvent<ChapterCreationArgs>
  ): Promise<void> {
    const controller = this.state.contentController;
    const topic = e.detail.topic;
    if (controller && topic !== null) {
      const chapter = new Chapter(crypto.randomUUID(), e.detail.chapterName);
      topic.addChapter(chapter);
      await controller.newChapter(chapter, '');
    }
  }

  private async renameChapterRequseted(
    e: CustomEvent<ChapterRenameArgs>
  ): Promise<void> {
    const controller = this.state.contentController;
    const chapter = e.detail.chapter;
    if (controller && chapter) {
      await controller.renameChapter(chapter, e.detail.newName);
    }
  }

  onTopicCreated(topic: Topic): void {
    this.setState({topics: this.state.topics.concat(topic)});
  }

  onTopicRenamed(_topic: Topic, _newName: string): void {
    this.setState({topics: this.state.topics.map(x => x)});
  }

  onTopicDeleted(topic: Topic): void {
    this.setState({
      topics: this.state.topics.filter(t => t.getId() !== topic.getId()),
    });
  }

  onChapterCreated(_chapter: Chapter): void {
    this.setState({topics: this.state.topics.map(x => x)});
  }

  onChapterMoved(_chapter: Chapter, _newTopic: Topic): void {
    this.setState({topics: this.state.topics.map(x => x)});
  }

  onChapterRenamed(chapter: Chapter, newName: string): void {
    chapter.setDisplayName(newName);
    this.setState({topics: this.state.topics.map(x => x)});
  }

  onChapterDeleted(_chapter: Chapter): void {
    this.setState({topics: this.state.topics.map(x => x)});
  }
}
