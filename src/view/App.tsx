import React from 'react';
import {ContentViewer} from './ContentViewer';
import {Topic} from '../model/model';
import {ContentController} from '../controller/contentcontroller';
import {FileSystemController} from '../controller/fs';
import {Explorer} from './Explorer';

export interface AppState {
  contentController: ContentController | null;
  topics: Topic[];
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
      rawMarkdownText: '',
      caretPos: 0,
      editorVisible: true,
      previewVisible: true,
    };
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
        <div className="ide-style-grid">
          <Explorer topics={this.state.topics} />
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

  public async openStore(): Promise<void> {
    const storeDirectoryHandle = await window.showDirectoryPicker();
    const contentController = new FileSystemController(storeDirectoryHandle);
    this.setState({contentController: contentController});
    contentController.getTopics(true).then(topics => {
      this.setState(() => ({topics: topics}));
    });
  }
}
