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
  selectedChapterElement: HTMLLIElement | null;
  selectedTopicElement: HTMLLIElement | null;
  selectedTopic: Topic | null;
  isAddingTopic: boolean;
}

export class ContentExplorer extends React.Component<
  ExplorerProps,
  ExplorerState
> {
  private explorerRef: RefObject<HTMLDivElement>;
  private createTopicElemRef: RefObject<ButtonlessForm>;
  private topicElementRefs: Map<string, RefObject<TopicElement>>;

  public constructor(props: ExplorerProps) {
    super(props);
    this.explorerRef = createRef();
    this.createTopicElemRef = createRef();
    this.topicElementRefs = new Map<string, RefObject<TopicElement>>();
    this.state = {
      selectedChapterElement: null,
      selectedTopicElement: null,
      selectedTopic: null,
      isAddingTopic: false,
    };
  }

  componentDidMount(): void {
    const explorer = this.explorerRef.current as HTMLDivElement;
    if (explorer === null) {
      return;
    }
    explorer.addEventListener(
      'chapterSelected',
      this.chapterSelected.bind(this)
    );
    explorer.addEventListener('topicSelected', this.topicSelected.bind(this));

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
    const explorer = this.explorerRef.current as HTMLDivElement;
    if (explorer === null) {
      return;
    }
    explorer.removeEventListener(
      'chapterSelected',
      this.chapterSelected.bind(this)
    );
    explorer.removeEventListener(
      'topicSelected',
      this.topicSelected.bind(this)
    );
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
    const currChecksum = this.props.topics
      .map(t => t.checksum())
      .reduce((s1, s2) => s1 + '-' + s2, '');
    const nextChecksum = nextProps.topics
      .map(t => t.checksum())
      .reduce((s1, s2) => s1 + '-' + s2, '');
    return (
      currChecksum !== nextChecksum ||
      nextState.isAddingTopic !== this.state.isAddingTopic ||
      nextState.selectedChapterElement !== this.state.selectedChapterElement
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
          {this.state.isAddingTopic && (
            <li>
              <ButtonlessForm
                promptText="Enter topic name"
                ref={this.createTopicElemRef}
              />
            </li>
          )}
        </ul>
      </div>
    );
  }

  private createNewTopic(): void {
    this.setState({isAddingTopic: true});
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

  private chapterSelected(e: CustomEvent<Chapter>): void {
    const selectedElem = e.target as HTMLLIElement;
    if (selectedElem) {
      selectedElem.classList.add('selected');
    }
    const oldSelectedElem = this.state.selectedChapterElement as HTMLLIElement;
    if (oldSelectedElem) {
      oldSelectedElem.classList.remove('selected');
    }
    this.setState({selectedChapterElement: selectedElem});
  }

  private topicSelected(e: CustomEvent<Topic>): void {
    const selectedElem = e.target as HTMLLIElement;
    if (selectedElem) {
      selectedElem.classList.add('selected');
    }
    const oldSelectedElem = this.state.selectedTopicElement as HTMLLIElement;
    if (oldSelectedElem) {
      oldSelectedElem.classList.remove('selected');
    }
    this.setState({
      selectedTopic: e.detail,
      selectedTopicElement: selectedElem,
    });
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
}
