import React from 'react';
import {ContentViewer} from './ContentViewer';
import {Chapter, Topic} from '../model/model';
import {ContentController} from '../controller/contentcontroller';
import {FileSystemController} from '../controller/fs';
import {ContentExplorer} from './ContentExplorer';

export interface AppState {
  contentController: ContentController | null;
  topics: Topic[];
  contentId: string;
  rawMarkdownText: string;
  caretPos: number;
  editorVisible: boolean;
  previewVisible: boolean;
}

export class App extends React.Component<{}, AppState> {
  public constructor(props: {}) {
    super(props);
    this.state = {
      contentController: null,
      topics: [],
      contentId: '-1',
      rawMarkdownText: '',
      caretPos: 0,
      editorVisible: true,
      previewVisible: true,
    };
  }

  componentDidMount(): void {
    document.addEventListener(
      'chapterselectedevent',
      this.loadChapter.bind(this)
    );
  }

  componentWillUnmount(): void {
    document.removeEventListener(
      'chapterselectedevent',
      this.loadChapter.bind(this)
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
          contentId={this.state.contentId}
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
    const storeDirectoryHandle = await window.showDirectoryPicker();
    const contentController = new FileSystemController(storeDirectoryHandle);
    this.setState({contentController: contentController});
    const newTopics = await contentController.getTopics(true);
    this.setState({topics: newTopics});
  }

  private async loadChapter(e: CustomEvent<Chapter>): Promise<void> {
    const controller = this.state.contentController;
    if (controller) {
      const chapter = e.detail as Chapter;
      const rawText = await controller.getChapterText(chapter);
      const contentId = chapter.getTopic()?.getId() + '-' + chapter.getId();
      this.setState({contentId: contentId, rawMarkdownText: rawText});
    }
  }
}
