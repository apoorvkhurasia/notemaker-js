import {Topic} from '../model/model';
import {TopicElement} from './TopicElement';
import React from 'react';

export interface ExplorerProps {
  topics: Topic[];
}

export class ContentExplorer extends React.Component<ExplorerProps> {
  public constructor(props: ExplorerProps) {
    super(props);
  }

  public render() {
    const topicLiElems = this.props.topics.map(topic => (
      <TopicElement key={topic.getId()} topic={topic}></TopicElement>
    ));
    return (
      <div id="explorer" className="left-sidebar">
        <nav className="menubar">
          <ul>
            <li>
              <a
                className="material-symbols-outlined"
                onClick={this.createNewTopic}
              >
                create_new_folder
              </a>
            </li>
            <li>
              <a
                className="material-symbols-outlined"
                onClick={this.createNewChapter}
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
