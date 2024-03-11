import React, {createRef} from 'react';
import {Topic} from '../model/model';
import {ChapterElement} from './ChapterElement';
import {ButtonlessForm} from './ButtonlessForm';
import ReactDOM from 'react-dom';
import {ChapterCreationArgs} from './ContentExplorer';

export interface TopicProps {
  topic: Topic;
}

export interface TopicElementState {
  isAddingChapter: boolean;
}

export class TopicElement extends React.Component<
  TopicProps,
  TopicElementState
> {
  private createChapterFormCmp: React.RefObject<ButtonlessForm>;

  public constructor(topicProps: TopicProps) {
    super(topicProps);
    this.createChapterFormCmp = createRef();
    this.state = {isAddingChapter: false};
  }

  componentDidMount(): void {
    const topicInputElem = ReactDOM.findDOMNode(
      this.createChapterFormCmp.current
    ) as HTMLElement;
    if (topicInputElem) {
      topicInputElem.addEventListener(
        'inputProvided',
        this.newChapterRequested.bind(this)
      );
      topicInputElem.addEventListener(
        'inputCancelled',
        this.chapterCreationCancelled.bind(this)
      );
    }
  }

  componentWillUnmount(): void {
    const topicInputElem = ReactDOM.findDOMNode(
      this.createChapterFormCmp.current
    ) as HTMLElement;
    if (topicInputElem) {
      topicInputElem.removeEventListener(
        'inputProvided',
        this.newChapterRequested.bind(this)
      );
      topicInputElem.removeEventListener(
        'inputCancelled',
        this.chapterCreationCancelled.bind(this)
      );
    }
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
          <ul>
            {chapterLiElems}
            <li
              style={{
                display: this.state.isAddingChapter ? 'inline-block' : 'none',
              }}
            >
              <ButtonlessForm
                promptText="Enter chapter name"
                ref={this.createChapterFormCmp}
              />
            </li>
          </ul>
        </details>
      </li>
    );
  }

  public showNewChapterForm() {
    this.setState(
      {isAddingChapter: true},
      (() => this.createChapterFormCmp.current?.focusInput()).bind(this)
    );
  }

  private selectTopic(): void {
    const myDOM = ReactDOM.findDOMNode(this);
    myDOM?.dispatchEvent(
      new CustomEvent<Topic>('topicSelected', {
        detail: this.props.topic,
        bubbles: true,
        cancelable: true,
        composed: false,
      })
    );
  }

  private chapterCreationCancelled(): void {
    this.setState({isAddingChapter: false});
  }

  private newChapterRequested(e: CustomEvent<string>): void {
    const name = e.detail;
    if (name === null || name.length === 0) {
      return;
    }
    const myDom = ReactDOM.findDOMNode(this);
    if (this.state.isAddingChapter && myDom) {
      myDom.dispatchEvent(
        new CustomEvent<ChapterCreationArgs>('newChapterRequested', {
          detail: {chapterName: name, topic: this.props.topic},
          bubbles: true,
          cancelable: true,
          composed: false,
        })
      );
      this.setState({isAddingChapter: false});
    }
  }
}
