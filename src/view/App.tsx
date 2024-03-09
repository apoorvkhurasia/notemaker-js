import React from 'react';
import {ContentViewer} from './ContentViewer';
import {Chapter, Topic} from '../model/model';
import {
  ContentController,
  ContentObserver,
} from '../controller/contentcontroller';
import {FileSystemController} from '../controller/fs';
import {ContentExplorer} from './ContentExplorer';

export interface AppState {
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
  private contentController: ContentController | null;

  public constructor(props: {}) {
    super(props);
    this.contentController = null;
    this.state = {
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
    document.addEventListener('topicSelected', this.selectTopic.bind(this));
    document.addEventListener(
      'newTopicRequested',
      this.createNewTopic.bind(this)
    );
    document.addEventListener(
      'newChapterRequested',
      this.createNewChapter.bind(this)
    );
  }

  componentWillUnmount(): void {
    document.removeEventListener(
      'chapterSelected',
      this.loadChapter.bind(this)
    );
    document.removeEventListener('topicSelected', this.selectTopic.bind(this));
    document.removeEventListener(
      'newTopicRequested',
      this.createNewTopic.bind(this)
    );
    document.removeEventListener(
      'newChapterRequested',
      this.createNewChapter.bind(this)
    );
  }

  public render() {
    return (
      <>
        <nav className="topmenu">
          <ul>
            <li>
              <a
                className="material-symbols-outlined"
                onClick={this.openStore.bind(this)}
              >
                folder_open
              </a>
              <a
                className="material-symbols-outlined"
                onClick={this.togglePreview.bind(this)}
              >
                {this.state.previewVisible ? 'preview_off' : 'preview'}
              </a>
              <a
                className="material-symbols-outlined"
                onClick={this.toggleEditorVisibility.bind(this)}
              >
                {this.state.editorVisible ? 'edit_off' : 'edit'}
              </a>
            </li>
          </ul>
        </nav>
        <ContentExplorer topics={this.state.topics} />
        <ContentViewer
          selectedChapter={this.state.selectedChapter}
          caretPos={this.state.caretPos}
          editorVisible={this.state.editorVisible}
          previewVisible={this.state.previewVisible}
          originalRawMarkdownText={this.state.rawMarkdownText}
        />
        <div className="footer">
          {this.state.lastSaveTs && (
            <label>Last saved: {this.state.lastSaveTs.toLocaleString()}</label>
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

  private async openStore(): Promise<void> {
    const oldContentController = this.contentController;
    if (oldContentController !== null) {
      oldContentController.removeObserver(this);
    }

    const storeDirectoryHandle = await window.showDirectoryPicker();
    const contentController = new FileSystemController(storeDirectoryHandle);
    this.contentController = contentController;
    const newTopics = await contentController.getTopics();
    this.setState({
      topics: newTopics,
      selectedChapter: null,
      selectedTopic: null,
    });
    this.contentController.addObserver(this);
  }

  private async loadChapter(e: CustomEvent<Chapter>): Promise<void> {
    const controller = this.contentController;
    if (controller) {
      const chapter = e.detail as Chapter;
      const rawText = await controller.getChapterText(chapter);
      this.setState({
        selectedTopic: chapter.getTopic(),
        selectedChapter: chapter,
        rawMarkdownText: rawText,
      });
    }
  }

  private selectTopic(e: CustomEvent<Topic>): void {
    this.setState({selectedTopic: e.detail});
  }

  private async createNewTopic(e: CustomEvent<string>): Promise<void> {
    const controller = this.contentController;
    if (controller) {
      const topic = new Topic(crypto.randomUUID(), e.detail);
      await controller.newTopic(topic);
    }
  }

  private async createNewChapter(e: CustomEvent<string>): Promise<void> {
    const controller = this.contentController;
    const selectedTopic = this.state.selectedTopic;
    if (controller && selectedTopic !== null) {
      const chapter = new Chapter(crypto.randomUUID(), e.detail);
      selectedTopic.addChapter(chapter);
      await controller.newChapter(chapter, '');
    }
  }

  onTopicCreated(topic: Topic): void {
    this.setState({topics: this.state.topics.concat(topic)});
  }

  onTopicRenamed(topic: Topic, newName: string): void {
    this.setState({topics: this.state.topics.map(x => x)});
  }

  onTopicDeleted(topic: Topic): void {
    this.setState({
      topics: this.state.topics.filter(t => t.getId() !== topic.getId()),
    });
  }

  onChapterCreated(chapter: Chapter): void {
    this.setState({topics: this.state.topics.map(x => x)});
  }

  onChapterMoved(chapter: Chapter, newTopic: Topic): void {
    this.setState({topics: this.state.topics.map(x => x)});
  }

  onChapterRenamed(chapter: Chapter, newName: string): void {
    this.setState({topics: this.state.topics.map(x => x)});
  }

  onChapterDeleted(chapter: Chapter): void {
    this.setState({topics: this.state.topics.map(x => x)});
  }
}
