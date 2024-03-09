import {Chapter, Topic} from '../model/model';
import {HideableEntryForm} from './HideableEntryForm';
import {TopicElement} from './TopicElement';
import React, {RefObject, createRef} from 'react';

export interface ExplorerProps {
  topics: Topic[];
}

export interface ExplorerState {
  selectedChapterElement: HTMLLIElement | null;
  isAddingTopic: boolean;
  isAddingChapter: boolean;
}

export class ContentExplorer extends React.Component<
  ExplorerProps,
  ExplorerState
> {
  private explorerRef: RefObject<HTMLDivElement>;

  public constructor(props: ExplorerProps) {
    super(props);
    this.explorerRef = createRef();
    this.state = {
      selectedChapterElement: null,
      isAddingChapter: false,
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
    explorer.addEventListener('inputProvided', this.inputFinalised.bind(this));
    explorer.addEventListener('inputCancelled', this.inputCancelled.bind(this));
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
      'inputProvided',
      this.inputFinalised.bind(this)
    );
    explorer.removeEventListener(
      'inputCancelled',
      this.inputCancelled.bind(this)
    );
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
      nextState.isAddingChapter !== this.state.isAddingChapter ||
      nextState.isAddingTopic !== this.state.isAddingTopic ||
      nextState.selectedChapterElement !== this.state.selectedChapterElement
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
            <li
              style={
                this.state.isAddingChapter || this.state.isAddingTopic
                  ? {display: 'inline-block'}
                  : {display: 'none'}
              }
            >
              <HideableEntryForm />
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
    this.setState({isAddingChapter: false, isAddingTopic: true});
    event.stopPropagation();
  }

  private createNewChapter(event: React.MouseEvent): void {
    this.setState({isAddingChapter: true, isAddingTopic: false});
    event.stopPropagation();
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

  private inputCancelled(): void {
    this.setState({isAddingChapter: false, isAddingTopic: false});
  }

  private inputFinalised(e: CustomEvent<string>): void {
    const name = e.detail;
    if (name === null) {
      return;
    }
    if (this.state.isAddingChapter && e.currentTarget) {
      e.currentTarget.dispatchEvent(
        new CustomEvent<string>('newChapterRequested', {
          detail: name,
          bubbles: true,
          cancelable: true,
          composed: false,
        })
      );
      this.setState({isAddingChapter: false});
    } else if (this.state.isAddingTopic && e.currentTarget) {
      e.currentTarget.dispatchEvent(
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
