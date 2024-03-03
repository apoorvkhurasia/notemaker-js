import React, {RefObject, createRef} from 'react';
import {ContentViewer} from './ContentViewer';
import {Chapter, Topic} from '../model/model';
import {ContentController} from '../controller/contentcontroller';
import {FileSystemController} from '../controller/fs';
import {ContentExplorer} from './ContentExplorer';

export interface AppState {
  contentController: ContentController | null;
  topics: Topic[];
  rawMarkdownText: string;
  caretPos: number;
  editorVisible: boolean;
  previewVisible: boolean;
}

export class App extends React.Component<{}, AppState> {
  private ide: RefObject<HTMLDivElement> = createRef();

  public constructor(props: {}) {
    super(props);
    this.state = {
      contentController: null,
      topics: [],
      rawMarkdownText: '',
      caretPos: 0,
      editorVisible: true,
      previewVisible: true,
    };
  }

  componentDidMount(): void {
    const ideGrid = this.ide.current as HTMLDivElement;
    if (ideGrid) {
      ideGrid.addEventListener(
        'chapterselectedevent',
        this.loadChapter.bind(this)
      );
    }
  }

  componentWillUnmount(): void {
    const ideGrid = this.ide.current as HTMLDivElement;
    if (ideGrid) {
      ideGrid.removeEventListener(
        'chapterselectedevent',
        this.loadChapter.bind(this)
      );
    }
  }

  public render() {
    return (
      <>
        <nav className="menubar">
          <ul>
            <li>
              <a
                id="open-store"
                className="material-symbols-outlined"
                onClick={this.openStore.bind(this)}
              >
                folder_open
              </a>
            </li>
          </ul>
        </nav>
        <div className="ide-style-grid" ref={this.ide}>
          <ContentExplorer topics={this.state.topics} />
          <ContentViewer
            caretPos={this.state.caretPos}
            editorVisible={this.state.editorVisible}
            previewVisible={this.state.previewVisible}
            rawMarkdownText={this.state.rawMarkdownText}
          />
        </div>
        <div id="footer" className="footer"></div>
      </>
    );
  }

  private async openStore(): Promise<void> {
    const storeDirectoryHandle = await window.showDirectoryPicker();
    const contentController = new FileSystemController(storeDirectoryHandle);
    this.setState({contentController: contentController});
    contentController.getTopics(true).then(topics => {
      this.setState(() => ({topics: topics}));
    });
  }

  private loadChapter(e: CustomEvent<Chapter>): void {
    const controller = this.state.contentController;
    if (controller) {
      controller.getChapterText(e.detail).then(text => {
        this.setState({rawMarkdownText: text});
      });
    }
  }
}
