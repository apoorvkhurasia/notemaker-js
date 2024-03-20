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
import {getSetting, pop} from '../lib/utils';

export interface AppState {
  contentController: ContentController | null;
  askStoreName: boolean;
  topics: Topic[];
  caretPos: number;
  editorVisible: boolean;
  previewVisible: boolean;
  lastSaveTs: Date | null;
  showContentControls: boolean;
  darkMode: boolean;
}

export class App
  extends React.Component<{}, AppState>
  implements ContentObserver
{
  private unsavedChapters = new Map<string, ChapterChangeArgs>();
  private storeNameInput: React.RefObject<ButtonlessForm>;
  private contentExplorerRef: React.RefObject<ContentExplorer>;
  private contentViewerRef: React.RefObject<ContentViewer>;
  private saveTimer: string | number | NodeJS.Timeout | null = null;
  private static readonly SAVE_INTERVAL = 5000;

  public constructor(props: {}) {
    super(props);
    this.storeNameInput = createRef();
    this.contentExplorerRef = createRef();
    this.contentViewerRef = createRef();
    this.state = {
      contentController: null,
      askStoreName: false,
      topics: [],
      caretPos: 0,
      editorVisible: true,
      previewVisible: true,
      lastSaveTs: null,
      showContentControls: false,
      darkMode: false,
    };
  }

  componentDidMount(): void {
    this.setState(
      {
        darkMode: getSetting<boolean>(
          'darkMode',
          false,
          (s: string) => s === 'true'
        ),
        previewVisible: getSetting<boolean>(
          'previewVisible',
          true,
          (s: string) => s === 'true'
        ),
        editorVisible: getSetting<boolean>(
          'editorVisible',
          true,
          (s: string) => s === 'true'
        ),
      },
      (() => this.setThemeFromState()).bind(this)
    );
    document.addEventListener(
      'selectChapterRequested',
      this.onSelectChapterRequested.bind(this)
    );
    document.addEventListener(
      'selectTopicRequested',
      this.onSelectTopicRequested.bind(this)
    );
    document.addEventListener(
      'newTopicRequested',
      this.onNewTopicRequested.bind(this)
    );
    document.addEventListener(
      'newChapterRequested',
      this.onNewChapterRequested.bind(this)
    );
    document.addEventListener(
      'chapterContentChanged',
      this.onChapterContentChanged.bind(this)
    );
    document.addEventListener(
      'renameChapterRequseted',
      this.onRenameChapterRequested.bind(this)
    );
    document.addEventListener(
      'deleteTopicRequested',
      this.onDeleteTopicRequested.bind(this)
    );
    document.addEventListener(
      'deleteChapterRequested',
      this.onDeleteChapterRequested.bind(this)
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
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
    }
    document.removeEventListener(
      'selectChapterRequested',
      this.onSelectChapterRequested.bind(this)
    );
    document.removeEventListener(
      'selectTopicRequested',
      this.onSelectTopicRequested.bind(this)
    );
    document.removeEventListener(
      'newTopicRequested',
      this.onNewTopicRequested.bind(this)
    );
    document.removeEventListener(
      'newChapterRequested',
      this.onNewChapterRequested.bind(this)
    );
    document.removeEventListener(
      'deleteTopicRequested',
      this.onDeleteTopicRequested.bind(this)
    );
    document.removeEventListener(
      'deleteChapterRequested',
      this.onDeleteChapterRequested.bind(this)
    );
    document.removeEventListener(
      'chapterContentChanged',
      this.onChapterContentChanged.bind(this)
    );
    document.removeEventListener(
      'renameChapterRequseted',
      this.onRenameChapterRequested.bind(this)
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
              <button
                className="navBtn"
                title="New Store"
                onClick={(() => {
                  this.setState({askStoreName: true}, () => {
                    this.storeNameInput.current?.focusInput();
                  });
                }).bind(this)}
              >
                New Store
              </button>
            </li>
            <li
              id="storeNameInputLi"
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
              <button
                className="navBtn"
                title="Open Store"
                onClick={this.openStore.bind(this)}
              >
                Open Store
              </button>
            </li>
            <li
              style={{
                display: this.state.showContentControls
                  ? 'inline-block'
                  : 'none',
              }}
            >
              <button
                className="navBtn"
                title={this.state.editorVisible ? 'Hide Editor' : 'Show Editor'}
                onClick={this.toggleEditorVisibility.bind(this)}
              >
                {this.state.editorVisible ? 'Hide Editor' : 'Show Editor'}
              </button>
            </li>
            <li
              style={{
                display: this.state.showContentControls
                  ? 'inline-block'
                  : 'none',
              }}
            >
              <button
                className="navBtn"
                title={
                  this.state.previewVisible ? 'Hide Preview' : 'Show Preview'
                }
                onClick={this.togglePreview.bind(this)}
              >
                {this.state.previewVisible ? 'Hide Preview' : 'Show Preview'}
              </button>
            </li>
            <li style={{float: 'right'}}>
              <button
                className="navBtn"
                title={
                  'Switch to ' +
                  (this.state.darkMode ? 'Light' : 'Dark') +
                  ' mode'
                }
                onClick={(() => {
                  this.setState({darkMode: !this.state.darkMode}, () => {
                    localStorage.setItem(
                      'darkMode',
                      this.state.darkMode.toString()
                    );
                    this.setThemeFromState();
                  });
                }).bind(this)}
              >
                {'Switch to ' +
                  (this.state.darkMode ? 'Light' : 'Dark') +
                  ' mode'}
              </button>
            </li>
          </ul>
        </nav>
        {this.state.contentController ? (
          <>
            <ContentExplorer
              topics={this.state.topics}
              ref={this.contentExplorerRef}
            />
            <ContentViewer
              caretPos={this.state.caretPos}
              editorVisible={this.state.editorVisible}
              previewVisible={this.state.previewVisible}
              ref={this.contentViewerRef}
            />
          </>
        ) : (
          <div className="init-message-screen">
            <div className="init-message">
              Create a new store or Open a new store to start using the app.{' '}
              <br />A store is a directory where your notes are stored.
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
    this.setState({previewVisible: !this.state.previewVisible}, () =>
      localStorage.setItem(
        'previewVisible',
        this.state.previewVisible.toString()
      )
    );
  }

  private toggleEditorVisibility(): void {
    this.setState({editorVisible: !this.state.editorVisible}, () =>
      localStorage.setItem('editorVisible', this.state.editorVisible.toString())
    );
  }

  private setThemeFromState(): void {
    const root = document.documentElement;
    if (this.state.darkMode) {
      root.classList.remove('light-mode');
      root.classList.add('dark-mode');
    } else {
      root.classList.add('light-mode');
      root.classList.remove('dark-mode');
    }
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
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
    }
    await this.saveUnsavedChapters();
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
        });
        contentController.addObserver(this);
      }
    } catch (err) {
      console.log(err);
      this.state.contentController?.addObserver(this);
    } finally {
      this.saveTimer = setInterval(
        this.saveUnsavedChapters.bind(this),
        App.SAVE_INTERVAL
      );
    }
  }

  private onSelectTopicRequested(e: CustomEvent<Topic>): void {
    this.selectTopic(e.detail);
  }

  private async onSelectChapterRequested(
    e: CustomEvent<Chapter>
  ): Promise<void> {
    await this.selectChapter(e.detail);
  }

  private onChapterContentChanged(e: CustomEvent<ChapterChangeArgs>): void {
    this.unsavedChapters.set(e.detail.chapter.getId(), e.detail);
  }

  private async saveUnsavedChapters(): Promise<void> {
    const controller = this.state.contentController;
    if (controller) {
      let change = pop(this.unsavedChapters);
      while (change) {
        await controller.saveChapter(change.chapter, change.rawMarkdownText);
        change = pop(this.unsavedChapters);
      }
    }
  }

  private async onNewTopicRequested(e: CustomEvent<string>): Promise<void> {
    const controller = this.state.contentController;
    if (controller) {
      const topic = new Topic(crypto.randomUUID(), e.detail);
      await controller.newTopic(topic);
    }
  }

  private async onDeleteTopicRequested(e: CustomEvent<Topic>): Promise<void> {
    const controller = this.state.contentController;
    if (controller) {
      await controller.deleteTopic(e.detail);
    }
  }

  private async onDeleteChapterRequested(
    e: CustomEvent<Chapter>
  ): Promise<void> {
    const controller = this.state.contentController;
    if (controller) {
      await controller.deleteChapter(e.detail);
    }
  }

  private async onNewChapterRequested(
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

  private async onRenameChapterRequested(
    e: CustomEvent<ChapterRenameArgs>
  ): Promise<void> {
    const controller = this.state.contentController;
    const chapter = e.detail.chapter;
    if (controller && chapter) {
      await controller.renameChapter(chapter, e.detail.newName);
    }
  }

  private selectTopic(topic: Topic | null): void {
    this.contentExplorerRef.current?.markTopicSelected(topic);
    if (
      !topic ||
      this.contentViewerRef.current?.getSelectedChapter()?.getTopic() !== topic
    ) {
      this.selectChapter(null);
    }
    this.contentExplorerRef.current?.markTopicSelected(topic);
  }

  private async selectChapter(chapter: Chapter | null): Promise<void> {
    const controller = this.state.contentController;
    if (controller && chapter !== null) {
      const rawText = await controller.getChapterText(chapter);
      this.contentExplorerRef.current?.markChapterSelected(chapter);
      this.contentViewerRef.current?.display(chapter, rawText);
      this.setState({showContentControls: true, lastSaveTs: null});
    } else {
      this.contentExplorerRef.current?.markChapterSelected(null);
      this.contentViewerRef.current?.display(null, '');
      this.setState({showContentControls: false, lastSaveTs: null});
    }
  }

  onTopicCreated(topic: Topic): void {
    this.setState(
      {
        topics: this.state.topics.concat(topic),
      },
      (() => this.selectTopic(topic)).bind(this)
    );
  }

  onTopicRenamed(topic: Topic, newName: string): void {
    topic.setDisplayName(newName);
    this.setState({topics: this.state.topics.map(x => x)});
  }

  onTopicDeleted(topic: Topic): void {
    this.setState(
      {
        topics: this.state.topics.filter(t => t.getId() !== topic.getId()),
      },
      (() => this.selectTopic(null)).bind(this)
    );
  }

  onChapterCreated(chapter: Chapter): void {
    this.setState(
      {topics: this.state.topics.map(x => x)},
      (async () => await this.selectChapter(chapter)).bind(this)
    );
  }

  onChapterMoved(chapter: Chapter, newTopic: Topic): void {
    newTopic.addChapter(chapter);
    this.setState({topics: this.state.topics.map(x => x)});
  }

  onChapterRenamed(chapter: Chapter, newName: string): void {
    chapter.setDisplayName(newName);
    this.setState({topics: this.state.topics.map(x => x)});
  }

  onChapterSaved(chapter: Chapter, saveTs: Date): void {
    if (chapter === this.contentViewerRef.current?.getSelectedChapter()) {
      this.setState({lastSaveTs: saveTs});
    }
  }

  onChapterDeleted(chapter: Chapter): void {
    chapter.getTopic()?.removeChapter(chapter);
    this.setState(
      {topics: this.state.topics.map(x => x)},
      (async () => await this.selectChapter(null)).bind(this)
    );
  }
}
