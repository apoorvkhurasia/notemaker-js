import React, {RefObject, createRef} from 'react';

export class HideableEntryForm extends React.Component<{}, {}> {
  private inputRef: RefObject<HTMLInputElement>;

  public constructor(props: {}) {
    super(props);
    this.inputRef = createRef();
  }

  public render() {
    return (
      <form
        onSubmit={e => {
          e.preventDefault(); //To prevent reload
          e.currentTarget.dispatchEvent(
            new CustomEvent<string>('inputProvided', {
              detail: this.inputRef.current?.value,
              bubbles: true,
              cancelable: true,
              composed: false,
            })
          );
        }}
        onAbort={e => {
          e.preventDefault(); //To prevent reload
          e.currentTarget.dispatchEvent(
            new Event('inputCancelled', {
              bubbles: true,
              cancelable: true,
              composed: false,
            })
          );
        }}
      >
        <input
          className="hideable-input"
          autoFocus={true}
          placeholder="Enter name"
          ref={this.inputRef}
        ></input>
        <input type="submit" style={{display: 'none'}} tabIndex={-1}></input>
        <input type="reset" style={{display: 'none'}} tabIndex={-1}></input>
      </form>
    );
  }
}
