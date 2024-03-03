import {parse} from 'marked';
import React from 'react';

export interface ContentViewerProps {
  contentId: string;
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
  public constructor(props: ContentViewerProps, state: ContentViewerState) {
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
      htmlOrPromise.then(h =>
        this.setState({rawMarkdownText: rawText, parsedHTML: h})
      );
    }
  }

  componentDidMount(): void {
    this.update(this.props.originalRawMarkdownText);
  }

  componentDidUpdate(
    prevProps: Readonly<ContentViewerProps>,
    prevState: Readonly<ContentViewerState>,
    snapshot?: any
  ): void {
    if (prevProps.contentId === this.props.contentId) {
      return;
    }
    this.update(this.props.originalRawMarkdownText);
  }

  public render() {
    return (
      <>
        <textarea
          id="markdownInput"
          className="editor-area"
          onChange={this.onMarkdownChange.bind(this)}
          defaultValue={this.state.rawMarkdownText}
        ></textarea>
        <div
          id="preview"
          className="formatted-content"
          dangerouslySetInnerHTML={{__html: this.state.parsedHTML}}
        ></div>
      </>
    );
  }

  private async onMarkdownChange(
    inputEvent: React.ChangeEvent<HTMLTextAreaElement>
  ) {
    const rawText = inputEvent.target.value;
    const parsedHTML = await parse(rawText);
    this.setState({parsedHTML: parsedHTML});
  }
}
