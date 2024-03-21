import ReactDOM from 'react-dom';
import {Chapter, Topic} from '../model/model';
import {ButtonlessForm} from './ButtonlessForm';
import {TopicElement} from './TopicElement';
import React, {RefObject, createRef} from 'react';
import {computeIfAbsent} from '../lib/utils';

export type ChapterCreationArgs = {
  topic: Topic;
  chapterName: string;
};

export interface ExplorerProps {
  topics: Topic[];
}

export interface ExplorerState {
  selectedChapter: Chapter | null;
  selectedTopic: Topic | null;
  isAddingTopic: boolean;
  isVisible: boolean;
}

export class ContentExplorer extends React.Component<
  ExplorerProps,
  ExplorerState
> {
  private createTopicElemRef: RefObject<ButtonlessForm>;
  private topicElementRefs: Map<string, RefObject<TopicElement>>;

  public constructor(props: ExplorerProps) {
    super(props);
    this.createTopicElemRef = createRef();
    this.topicElementRefs = new Map<string, RefObject<TopicElement>>();
    this.state = {
      selectedChapter: null,
      selectedTopic: null,
      isAddingTopic: false,
      isVisible: true,
    };
  }

  componentDidMount(): void {
    const topicInputCmp = this.createTopicElemRef.current;
    const topicInputElem = ReactDOM.findDOMNode(topicInputCmp) as HTMLElement;
    if (topicInputElem) {
      topicInputElem.addEventListener(
        'inputProvided',
        this.newTopicRequested.bind(this)
      );
      topicInputElem.addEventListener(
        'inputCancelled',
        this.topicCreationCancelled.bind(this)
      );
    }
  }

  componentWillUnmount(): void {
    const topicInputCmp = this.createTopicElemRef.current;
    const topicInputElem = ReactDOM.findDOMNode(topicInputCmp) as HTMLElement;
    if (topicInputElem) {
      topicInputElem.removeEventListener(
        'inputProvided',
        this.newTopicRequested.bind(this)
      );
      topicInputElem.removeEventListener(
        'inputCancelled',
        this.topicCreationCancelled.bind(this)
      );
    }
  }

  shouldComponentUpdate(
    nextProps: Readonly<ExplorerProps>,
    nextState: Readonly<ExplorerState>
  ): boolean {
    return (
      nextProps.topics !== this.props.topics ||
      nextState.isVisible !== this.state.isVisible ||
      nextState.isAddingTopic !== this.state.isAddingTopic ||
      nextState.selectedTopic !== this.state.selectedTopic ||
      nextState.selectedChapter !== this.state.selectedChapter
    );
  }

  public render() {
    const topicLiElems = this.props.topics.map(topic => (
      <TopicElement
        key={topic.getId()}
        topic={topic}
        ref={computeIfAbsent(this.topicElementRefs, topic.getId(), () =>
          createRef()
        )}
      ></TopicElement>
    ));
    return (
      <div id="explorer" className="left-sidebar">
        <nav className="topmenu">
          <ul>
            <li
              style={{display: this.state.isVisible ? 'inline-block' : 'none'}}
            >
              <button
                className={'navBtn material-symbols-outlined'}
                onClick={this.createNewTopic.bind(this)}
                title="Add a new topic"
              >
                create_new_folder
              </button>
            </li>
            <li
              style={{
                display:
                  this.state.isVisible && this.state.selectedTopic !== null
                    ? 'inline-block'
                    : 'none',
              }}
            >
              <button
                className={'navBtn material-symbols-outlined'}
                onClick={this.createNewChapter.bind(this)}
                title="Add a new chapter under the current topic"
              >
                new_window
              </button>
            </li>
            <li
              style={{
                display: 'inline-block',
                float: this.state.isVisible ? 'right' : 'left',
              }}
            >
              <button
                className={'navBtn material-symbols-outlined'}
                onClick={this.toggleVisibility.bind(this)}
                title="Add a new topic"
              >
                {this.state.isVisible ? (
                  <>left_panel_close</>
                ) : (
                  <>left_panel_open</>
                )}
              </button>
            </li>
          </ul>
        </nav>
        <ul
          id="explorer-items"
          className="tree"
          style={{display: this.state.isVisible ? 'block' : 'none'}}
        >
          {topicLiElems}
          <li
            style={{
              display: this.state.isAddingTopic ? 'inline-block' : 'none',
            }}
          >
            <ButtonlessForm
              promptText="Enter topic name"
              ref={this.createTopicElemRef}
            />
          </li>
        </ul>
      </div>
    );
  }

  public markTopicSelected(topic: Topic | null): void {
    const currentSelectedTopic = this.state.selectedTopic;
    if (currentSelectedTopic === topic) {
      return;
    }
    if (currentSelectedTopic) {
      const oldSelectedTopicElement = this.topicElementRefs.get(
        currentSelectedTopic.getId()
      )?.current;
      oldSelectedTopicElement?.markSelected(false);
    }
    this.setState(
      {selectedTopic: topic},
      (() => {
        const selectedTopic = this.state.selectedTopic;
        if (selectedTopic !== null) {
          this.topicElementRefs
            .get(selectedTopic.getId())
            ?.current?.markSelected(true);
        }
      }).bind(this)
    );
  }

  public markChapterSelected(chapter: Chapter | null): void {
    const currentSelectedChapter = this.state.selectedChapter;
    if (currentSelectedChapter === chapter) {
      return;
    }
    if (currentSelectedChapter) {
      const topicOfCurrentSelectedChapter = currentSelectedChapter.getTopic();
      if (topicOfCurrentSelectedChapter !== null) {
        this.topicElementRefs
          .get(topicOfCurrentSelectedChapter.getId())
          ?.current?.markChapterSelected(currentSelectedChapter, false);
      }
    }
    this.setState(
      {
        selectedChapter: chapter,
        selectedTopic: chapter?.getTopic() || null,
      },
      (() => {
        const chapter = this.state.selectedChapter;
        const topic = this.state.selectedTopic;
        if (chapter !== null && topic !== null) {
          this.topicElementRefs
            .get(topic.getId())
            ?.current?.markChapterSelected(chapter, true);
        }
      }).bind(this)
    );
  }

  private createNewTopic(): void {
    this.setState(
      {isAddingTopic: true},
      (() => this.createTopicElemRef.current?.focusInput()).bind(this)
    );
  }

  private createNewChapter(): void {
    this.setState({isAddingTopic: false});
    const selectedTopic = this.state.selectedTopic;
    if (selectedTopic) {
      this.topicElementRefs
        .get(selectedTopic.getId())
        ?.current?.showNewChapterForm();
    }
  }

  private topicCreationCancelled(): void {
    this.setState({isAddingTopic: false});
  }

  private newTopicRequested(e: CustomEvent<string>): void {
    const name = e.detail;
    if (name === null || name.length === 0) {
      return;
    }
    const myDom = ReactDOM.findDOMNode(this);
    if (this.state.isAddingTopic && myDom) {
      myDom.dispatchEvent(
        new CustomEvent<string>('newTopicRequested', {
          detail: name,
          bubbles: true,
          cancelable: true,
          composed: false,
        })
      );
      this.setState({isAddingTopic: false});
    }
  }

  private toggleVisibility(): void {
    this.setState({isVisible: !this.state.isVisible});
  }
}
