import React from 'react';
import {Topic} from '../model/model';
import {ChapterElement} from './chapter';

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
      .map(chp => <ChapterElement chapter={chp}></ChapterElement>);
    return (
      <li>
        <details>
          <summary>{this.props.topic.getDisplayName()}</summary>
          <ul id="chpList">{chapterLiElems}</ul>
        </details>
      </li>
    );
  }
}
