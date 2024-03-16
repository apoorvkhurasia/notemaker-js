import React, {RefObject, createRef} from 'react';
import ReactDOM from 'react-dom';

export interface ButtonlessFormProps {
  promptText: string;
}

export class ButtonlessForm extends React.Component<ButtonlessFormProps, {}> {
  private inputRef: RefObject<HTMLInputElement>;

  public constructor(props: ButtonlessFormProps) {
    super(props);
    this.inputRef = createRef();
  }

  componentDidMount(): void {
    const me = ReactDOM.findDOMNode(this) as HTMLElement;
    if (me) {
      me.addEventListener('focus', this.focusInput.bind(this));
    }
  }

  componentDidUnmount(): void {
    const me = ReactDOM.findDOMNode(this) as HTMLElement;
    if (me) {
      me.removeEventListener('focus', this.focusInput.bind(this));
    }
  }

  public render() {
    return (
      <form
        onSubmit={e => {
          e.preventDefault(); //To prevent reload
          const inputElem = this.inputRef.current;
          if (inputElem) {
            const name = inputElem.value;
            if (name && name.trim().length > 0) {
              e.currentTarget.dispatchEvent(
                new CustomEvent<string>('inputProvided', {
                  detail: name,
                  bubbles: true,
                  cancelable: true,
                  composed: false,
                })
              );
            }
            inputElem.value = '';
          }
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
          className="mini-editor"
          tabIndex={0}
          placeholder={this.props.promptText}
          onKeyUp={(e: React.KeyboardEvent) => {
            if (e.key === 'Escape') {
              e.currentTarget.dispatchEvent(
                new Event('inputCancelled', {
                  bubbles: true,
                  cancelable: true,
                  composed: false,
                })
              );
            }
          }}
          ref={this.inputRef}
        ></input>
        <input type="submit" style={{display: 'none'}} tabIndex={-1}></input>
        <input type="reset" style={{display: 'none'}} tabIndex={-1}></input>
      </form>
    );
  }

  public focusInput(): void {
    this.inputRef.current?.focus();
  }
}
