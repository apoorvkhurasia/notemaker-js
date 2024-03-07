import React from 'react';
import {ContentViewer} from './ContentViewer';
import {
  Chapter,
  ChapterObserver,
  ChapterTrigger,
  Topic,
  TopicObserver,
  TopicTrigger,
} from '../model/model';
import {ContentController} from '../controller/contentcontroller';
import {FileSystemController} from '../controller/fs';
import {ContentExplorer} from './ContentExplorer';

export interface AppState {
  contentController: ContentController | null;
  topics: Topic[];
  selectedTopic: Topic | null;
  selectedChapter: Chapter | null;
  rawMarkdownText: string;
  caretPos: number;
  editorVisible: boolean;
  previewVisible: boolean;
}

export class App
  extends React.Component<{}, AppState>
  implements ChapterTrigger, TopicTrigger, ChapterObserver, TopicObserver
{
  public constructor(props: {}) {
    super(props);
    this.state = {
      contentController: null,
      topics: [],
      selectedTopic: null,
      selectedChapter: null,
      rawMarkdownText: '',
      caretPos: 0,
      editorVisible: true,
      previewVisible: true,
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
          <label style={{textAlign: 'left'}}>Word Count: 190</label>
          <label style={{textAlign: 'right'}}>md</label>
        </div>
      </>
    );
  }

  private async openStore(): Promise<void> {
    for (const t of this.state.topics) {
      t.removeTrigger(this);
      t.removeObserver(this);
      for (const c of t.getChapters()) {
        c.removeTrigger(this);
        c.removeObserver(this);
      }
    }
    const storeDirectoryHandle = await window.showDirectoryPicker();
    const contentController = new FileSystemController(storeDirectoryHandle);
    this.setState({contentController: contentController});
    const newTopics = await contentController.getTopics();
    for (const t of newTopics) {
      for (const c of t.getChapters()) {
        c.addTrigger(this);
        c.addObserver(this);
      }
      t.addTrigger(this);
      t.addObserver(this);
    }
    this.setState({
      topics: newTopics,
      selectedChapter: null,
      selectedTopic: null,
    });
  }

  private async loadChapter(e: CustomEvent<Chapter>): Promise<void> {
    const controller = this.state.contentController;
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
    const controller = this.state.contentController;
    if (controller) {
      const topic = new Topic(crypto.randomUUID(), e.detail);
      topic.addTrigger(this);
      topic.addObserver(this);
      await controller.newTopic(topic);
      this.setState({topics: this.state.topics.concat(topic)});
    }
  }

  private async createNewChapter(e: CustomEvent<string>): Promise<void> {
    const controller = this.state.contentController;
    const selectedTopic = this.state.selectedTopic;
    if (controller && selectedTopic !== null) {
      const chapter = new Chapter(crypto.randomUUID(), e.detail);
      chapter.addTrigger(this);
      chapter.addObserver(this);
      selectedTopic.addChapter(chapter);
    }
  }

  async beforeChapterCreation(chapter: Chapter): Promise<void> {
    await this.state.contentController?.newChapter(chapter, '');
  }

  async beforeChapterMove(chapter: Chapter, newTopic: Topic): Promise<void> {
    await this.state.contentController?.moveChapter(chapter, newTopic);
  }

  async beforeChapterRename(chapter: Chapter, newName: string): Promise<void> {
    await this.state.contentController?.renameChapter(chapter, newName);
  }

  async beforeChapterDeletion(chapter: Chapter): Promise<void> {
    await this.state.contentController?.deleteChapter(chapter);
  }

  async beforeTopicDeletion(topic: Topic): Promise<void> {
    await this.state.contentController?.deleteTopic(topic);
  }

  async beforeTopicRename(topic: Topic, newName: string): Promise<void> {
    await this.state.contentController?.renameTopic(topic, newName);
  }

  public async afterChapterCreation(chapter: Chapter): Promise<void> {
    this.setState({
      selectedChapter: chapter,
      selectedTopic: chapter.getTopic(),
      topics: this.state.topics,
    });
  }

  public async afterChapterMove(
    chapter: Chapter,
    oldTopic: Topic
  ): Promise<void> {
    this.setState({
      selectedChapter: chapter,
      selectedTopic: chapter.getTopic(),
    });
  }

  public async afterChapterRenamed(
    chapter: Chapter,
    oldName: string
  ): Promise<void> {
    this.setState({
      selectedChapter: chapter,
      selectedTopic: chapter.getTopic(),
    });
  }

  public async afterChapterDeletion(chapter: Chapter): Promise<void> {
    this.setState({
      selectedChapter: null,
      selectedTopic: chapter.getTopic(),
    });
    chapter.removeTrigger(this);
    chapter.removeObserver(this);
  }

  public async afterTopicDeletion(topic: Topic): Promise<void> {
    this.setState({
      selectedChapter: null,
      selectedTopic: null,
    });
    topic.removeTrigger(this);
    topic.removeObserver(this);
  }

  public async afterTopicRename(topic: Topic, oldName: string): Promise<void> {
    this.setState({
      selectedChapter: null,
      selectedTopic: topic,
    });
  }
}
