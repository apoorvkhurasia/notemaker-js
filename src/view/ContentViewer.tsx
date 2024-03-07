import {parse} from 'marked';
import React from 'react';
import {Chapter} from '../model/model';

export interface ContentViewerProps {
  selectedChapter: Chapter | null;
  originalRawMarkdownText: string;
  caretPos: number;
  editorVisible: boolean;
  previewVisible: boolean;
}

export interface ContentViewerState {
  rawMarkdownText: string;
  parsedHTML: string;
}

export class ContentViewer extends React.Component<
  ContentViewerProps,
  ContentViewerState
> {
  public constructor(props: ContentViewerProps) {
    super(props);
    this.state = {
      rawMarkdownText: props.originalRawMarkdownText,
      parsedHTML: '<div></div>',
    };
  }

  update(rawText: string): void {
    const htmlOrPromise = parse(rawText);
    if (typeof htmlOrPromise === 'string') {
      this.setState({rawMarkdownText: rawText, parsedHTML: htmlOrPromise});
    } else {
      this.setState({rawMarkdownText: rawText}); //This must always be done synchronously
      htmlOrPromise.then(h => this.setState({parsedHTML: h}));
    }
  }

  componentDidMount(): void {
    this.update(this.props.originalRawMarkdownText);
  }

  componentDidUpdate(
    prevProps: Readonly<ContentViewerProps>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    prevState: Readonly<ContentViewerState>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    snapshot?: unknown
  ): void {
    if (
      prevProps.selectedChapter?.getId() === this.props.selectedChapter?.getId()
    ) {
      return;
    }
    this.update(this.props.originalRawMarkdownText);
  }

  public render() {
    return (
      <>
        <textarea
          id="markdownInput"
          style={
            this.props.selectedChapter === null
              ? {display: 'none'}
              : {display: 'block'}
          }
          className="editor-area"
          onChange={this.onMarkdownChange.bind(this)}
          value={this.state.rawMarkdownText}
          autoFocus={true}
          placeholder={'Type in markdown syntax here. LaTeX is supported.'}
        ></textarea>
        <div
          id="preview"
          className="formatted-content"
          dangerouslySetInnerHTML={{__html: this.state.parsedHTML}}
        ></div>
      </>
    );
  }

  private async onMarkdownChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    this.update(e.target.value);
  }
}
