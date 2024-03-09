import showdown from 'showdown';
import React, {createRef} from 'react';
import {Chapter} from '../model/model';

export interface ContentViewerProps {
  selectedChapter: Chapter | null;
  originalRawMarkdownText: string;
  caretPos: number;
  editorVisible: boolean;
  previewVisible: boolean;
}

export interface ChapterChangeArgs {
  chapter: Chapter;
  rawMarkdownText: string;
}

export interface ContentViewerState {
  isInitialising: boolean;
  rawMarkdownText: string;
  parsedHTML: string;
}

export class ContentViewer extends React.Component<
  ContentViewerProps,
  ContentViewerState
> {
  private converter = new showdown.Converter({
    metadata: true,
    parseImgDimensions: true,
    simplifiedAutoLink: true,
    tables: true,
    strikethrough: true,
    tasklists: true,
    smoothLivePreview: true,
    smartIndentationFix: false,
    requireSpaceBeforeHeadingText: true,
    openLinksInNewWindow: true,
    ellipsis: true,
    simpleLineBreaks: true,
  });
  private editorRef: React.RefObject<HTMLTextAreaElement>;

  public constructor(props: ContentViewerProps) {
    super(props);
    this.editorRef = createRef();
    this.state = {
      isInitialising: true,
      rawMarkdownText: props.originalRawMarkdownText,
      parsedHTML: this.converter.makeHtml(props.originalRawMarkdownText),
    };
  }

  componentDidUpdate(
    prevProps: Readonly<ContentViewerProps>,
    _prevState: Readonly<ContentViewerState>,
    _snapshot?: unknown
  ): void {
    if (
      prevProps.selectedChapter?.getId() !== this.props.selectedChapter?.getId()
    ) {
      //New chapter
      this.setState({isInitialising: true}, () => {
        this.update(this.props.originalRawMarkdownText);
        this.setState({isInitialising: false});
      });
    } else if (prevProps.previewVisible !== this.props.previewVisible) {
      this.update(this.state.rawMarkdownText);
    }
  }

  public render() {
    return (
      <>
        <textarea
          id="markdownInput"
          ref={this.editorRef}
          style={{
            display:
              this.props.selectedChapter !== null && this.props.editorVisible
                ? 'block'
                : 'none',
          }}
          className={this.props.previewVisible ? 'half-editor' : 'full-editor'}
          onChange={this.onMarkdownChange.bind(this)}
          value={this.state.rawMarkdownText}
          autoFocus={true}
          placeholder={
            'Type in markdown syntax here. LaTeX is not supported yet.'
          }
        ></textarea>
        <div
          id="preview"
          className={this.props.editorVisible ? 'half-preview' : 'full-preview'}
          style={
            this.props.previewVisible ? {display: 'block'} : {display: 'none'}
          }
          dangerouslySetInnerHTML={{__html: this.state.parsedHTML}}
        ></div>
      </>
    );
  }

  private async onMarkdownChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    this.update(e.target.value);
  }

  private update(rawText: string): void {
    const editor = this.editorRef.current;
    if (!this.state.isInitialising && editor) {
      editor.dispatchEvent(
        new CustomEvent<ChapterChangeArgs>('chapterContentChanged', {
          detail: {
            chapter: this.props.selectedChapter as Chapter,
            rawMarkdownText: rawText,
          },
          bubbles: true,
          cancelable: false,
          composed: false,
        })
      );
    }
    if (this.props.previewVisible) {
      const html = this.converter.makeHtml(rawText);
      this.setState({
        rawMarkdownText: rawText,
        parsedHTML: html,
      });
    } else {
      this.setState({
        rawMarkdownText: rawText,
      });
    }
  }
}
