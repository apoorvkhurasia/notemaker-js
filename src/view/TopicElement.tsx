import React from 'react';
import {Topic} from '../model/model';
import {ChapterElement} from './ChapterElement';

export interface TopicProps {
  topic: Topic;
}

export class TopicElement extends React.Component<TopicProps, {}> {
  public constructor(topicProps: TopicProps) {
    super(topicProps);
  }

  public render() {
    const chapterLiElems = this.props.topic
      .getChapters()
      .map(chp => (
        <ChapterElement key={chp.getId()} chapter={chp}></ChapterElement>
      ));
    return (
      <li className="topic" onClick={this.selectTopic.bind(this)}>
        <details>
          <summary>{this.props.topic.getDisplayName()}</summary>
          <ul id="chpList">{chapterLiElems}</ul>
        </details>
      </li>
    );
  }

  private selectTopic(e: React.MouseEvent): void {
    e.currentTarget.dispatchEvent(
      new CustomEvent<Topic>('topicSelected', {
        detail: this.props.topic,
        bubbles: true,
        cancelable: true,
        composed: false,
      })
    );
  }
}
