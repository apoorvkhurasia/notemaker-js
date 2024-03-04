import {Chapter, Topic} from '../model/model';
import {TopicElement} from './TopicElement';
import React, {RefObject, createRef} from 'react';

export interface ExplorerProps {
  topics: Topic[];
}

export interface ExplorerState {
  selectedChapterElement: HTMLLIElement | null;
}

export class ContentExplorer extends React.Component<
  ExplorerProps,
  ExplorerState
> {
  private explorerRef: RefObject<HTMLDivElement>;

  public constructor(props: ExplorerProps) {
    super(props);
    this.explorerRef = createRef();
    this.state = {selectedChapterElement: null};
  }

  componentDidMount(): void {
    const explorer = this.explorerRef.current as HTMLDivElement;
    if (explorer === null) {
      return;
    }
    explorer.addEventListener(
      'chapterselectedevent',
      (e: CustomEvent<Chapter>) => {
        const selectedElem = e.target as HTMLLIElement;
        if (selectedElem) {
          selectedElem.classList.add('selected');
        }
        const oldSelectedElem = this.state
          .selectedChapterElement as HTMLLIElement;
        if (oldSelectedElem) {
          oldSelectedElem.classList.remove('selected');
        }
        this.setState({selectedChapterElement: selectedElem});
      }
    );
  }

  public render() {
    const topicLiElems = this.props.topics.map(topic => (
      <TopicElement key={topic.getId()} topic={topic}></TopicElement>
    ));
    return (
      <div id="explorer" ref={this.explorerRef} className="left-sidebar">
        <nav className="topmenu">
          <ul>
            <li>
              <a
                className="material-symbols-outlined"
                onClick={this.createNewTopic.bind(this)}
              >
                create_new_folder
              </a>
            </li>
            <li>
              <a
                className="material-symbols-outlined"
                onClick={this.createNewChapter.bind(this)}
              >
                new_window
              </a>
            </li>
          </ul>
        </nav>
        <ul id="explorer-items" className="tree">
          {topicLiElems}
        </ul>
      </div>
    );
  }

  private createNewTopic(event: React.MouseEvent): void {
    event.stopPropagation();
    dispatchEvent(
      new Event('createTopicRequested', {
        bubbles: true,
        cancelable: true,
        composed: false,
      })
    );
  }

  private createNewChapter(event: React.MouseEvent): void {
    event.stopPropagation();
    dispatchEvent(
      new Event('createChapterRequested', {
        bubbles: true,
        cancelable: true,
        composed: false,
      })
    );
  }
}
