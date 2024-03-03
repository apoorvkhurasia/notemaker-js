import {Topic} from '../model/model';
import {TopicElement} from './TopicElement';
import React from 'react';

export interface ExplorerProps {
  topics: Topic[];
}

export class Explorer extends React.Component<ExplorerProps> {
  public readonly TAG_NAME = 'content-explorer';

  public constructor(props: ExplorerProps) {
    super(props);
  }

  public render() {
    const topicLiElems = this.props.topics.map(topic => (
      <TopicElement topic={topic}></TopicElement>
    ));
    return (
      <>
        <nav>
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
        <ul id="root">{topicLiElems}</ul>
      </>
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
