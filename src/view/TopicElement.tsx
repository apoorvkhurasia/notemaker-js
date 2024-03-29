import React, {RefObject, createRef} from 'react';
import {Chapter, Topic} from '../model/model';
import {ChapterElement} from './ChapterElement';
import {ButtonlessForm} from './ButtonlessForm';
import ReactDOM from 'react-dom';
import {ChapterCreationArgs} from './ContentExplorer';
import {computeIfAbsent} from '../lib/utils';

export interface TopicProps {
  topic: Topic;
}

export interface TopicElementState {
  isAddingChapter: boolean;
  isSelected: boolean;
}

export class TopicElement extends React.Component<
  TopicProps,
  TopicElementState
> {
  private createChapterFormCmp: RefObject<ButtonlessForm>;
  private chapterElemRefs: Map<string, RefObject<ChapterElement>>;

  public constructor(topicProps: TopicProps) {
    super(topicProps);
    this.createChapterFormCmp = createRef();
    this.chapterElemRefs = new Map<string, RefObject<ChapterElement>>();
    this.state = {isAddingChapter: false, isSelected: false};
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
        <ChapterElement
          key={chp.getId()}
          chapter={chp}
          ref={computeIfAbsent(this.chapterElemRefs, chp.getId(), () =>
            createRef()
          )}
        ></ChapterElement>
      ));
    return (
      <li
        className={'topic' + (this.state.isSelected ? ' selected' : '')}
        onClick={this.selectTopicRequested.bind(this)}
      >
        <details open style={{cursor: 'default'}}>
          <summary>
            <div className="topic-nav">{this.props.topic.getDisplayName()}</div>
            {this.state.isSelected && (
              <button
                className="explorer-mini-btn material-symbols-outlined"
                onClick={this.deleteTopicRequested.bind(this)}
              >
                delete
              </button>
            )}
          </summary>
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

  public markSelected(isSelected: boolean): void {
    this.setState({isSelected: isSelected});
    if (!isSelected) {
      this.setState({isAddingChapter: false});
    }
  }

  public markChapterSelected(chapter: Chapter, isSelected: boolean): void {
    this.chapterElemRefs
      .get(chapter.getId())
      ?.current?.markSelected(isSelected);
    this.markSelected(isSelected); //Also set topic selection state
  }

  private selectTopicRequested(): void {
    const myDOM = ReactDOM.findDOMNode(this);
    myDOM?.dispatchEvent(
      new CustomEvent<Topic>('selectTopicRequested', {
        detail: this.props.topic,
        bubbles: true,
        cancelable: true,
        composed: false,
      })
    );
  }

  private deleteTopicRequested(e: React.MouseEvent): void {
    if (
      !confirm(
        'Are you sure you want to delete topic "' +
          this.props.topic.getDisplayName() +
          '"?'
      )
    ) {
      e.preventDefault();
    } else {
      const myDOM = ReactDOM.findDOMNode(this);
      myDOM?.dispatchEvent(
        new CustomEvent<Topic>('deleteTopicRequested', {
          detail: this.props.topic,
          bubbles: true,
          cancelable: true,
          composed: false,
        })
      );
    }
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
