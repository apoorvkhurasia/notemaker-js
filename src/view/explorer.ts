import * as model from '../lib/model';
import * as cmp from './components';

export class ExplorerView
  implements model.ChapterObserver, model.TopicObserver
{
  private htmlRootElem: Element;

  public constructor(htmlRootElem: Element) {
    this.htmlRootElem = htmlRootElem;
  }

  public onTopicRemoved(topic: model.Topic): void {
    const ownerDocument = this.htmlRootElem.ownerDocument;
    if (this.htmlRootElem !== null) {
      const topicListElem = ownerDocument.getElementById('topic-list');
      if (topicListElem !== null) {
        const topicElem = ownerDocument.getElementById(
          this.getTopicNodeIdentifier(topic)
        );
        if (topicElem !== null) {
          topicListElem.removeChild(topicElem);
        }
        if (topicListElem.children.length === 0) {
          this.htmlRootElem.removeChild(topicListElem);
        }
      }
    }
  }

  public onTopicCreated(topic: model.Topic): void {
    const ownerDocument = this.htmlRootElem.ownerDocument;
    if (this.htmlRootElem !== null) {
      let topicListElem = ownerDocument.getElementById('topic-list');
      if (topicListElem === null) {
        topicListElem = ownerDocument.createElement('ul');
        topicListElem.id = 'topic-list';
        this.htmlRootElem.appendChild(topicListElem);
      }
      topicListElem.appendChild(this.createTopicElement(topic, ownerDocument));
    }
  }

  public init(topics: Array<model.Topic>): void {
    const ownerDocument = this.htmlRootElem.ownerDocument;
    while (this.htmlRootElem.firstChild !== null) {
      this.htmlRootElem.removeChild(this.htmlRootElem.firstChild);
    }
    const topicListElem = ownerDocument.createElement('ul');
    topicListElem.id = 'topic-list';
    for (const topic of topics) {
      topicListElem.appendChild(this.createTopicElement(topic, ownerDocument));
    }
    this.htmlRootElem.appendChild(topicListElem);
  }

  public onChapterCreated(chapter: model.Chapter): void {
    const ownerDocument = this.htmlRootElem.ownerDocument;
    const topicElem = ownerDocument.getElementById(
      this.getTopicNodeIdentifier(chapter.getTopic())
    );
    if (topicElem === null) {
      return;
    }
    let chapterListElement = ownerDocument.getElementById(
      this.getTopicNodeIdentifier(chapter.getTopic()) + '-chplist'
    );
    if (chapterListElement !== null) {
      chapterListElement = ownerDocument.createElement('ol');
      chapterListElement.id =
        this.getTopicNodeIdentifier(chapter.getTopic()) + '-chplist';
      topicElem.appendChild(chapterListElement);
    }
    // @ts-ignore
    chapterListElement.appendChild(
      this.createChapterElement(chapter, ownerDocument)
    );
  }

  public onChapterMove(chapter: model.Chapter, oldTopic: model.Topic): void {
    //TODO: Implement when adding support for drag drop
  }

  private getTopicNodeIdentifier(topic: model.Topic): string {
    return 'topic-' + topic.getId();
  }

  private getChapterNodeIdentifier(chapter: model.Chapter): string {
    return 'chapter-' + chapter.getTopic().getId() + '-' + chapter.getId();
  }

  private createTopicElement(topic: model.Topic, ownerDocument: Document) {
    const chapterElems = topic
      .getChapters()
      .map(chapter => this.createChapterElement(chapter, ownerDocument));

    const topicElem = cmp.createListItem(
      ownerDocument,
      topic.getDisplayName(),
      this.getTopicNodeIdentifier(topic),
      () => {
        for (const chapterElem of chapterElems) {
          cmp.toggleElemVisibility(chapterElem);
        }
      }
    );

    const chapterListElem = ownerDocument.createElement('ol');
    chapterListElem.id = this.getTopicNodeIdentifier(topic) + '-chplist';
    chapterElems.forEach(el => chapterListElem.appendChild(el));

    topicElem.appendChild(chapterListElem);
    return topicElem;
  }

  private createChapterElement(
    chapter: model.Chapter,
    ownerDocument: Document
  ): Element {
    const listItem = ownerDocument.createElement('li');
    listItem.id = this.getChapterNodeIdentifier(chapter);
    const linkElem = ownerDocument.createElement('a');
    linkElem.appendChild(
      ownerDocument.createTextNode(chapter.getDisplayName())
    );
    linkElem.addEventListener('click', () => {
      linkElem.dispatchEvent(
        new CustomEvent<model.Chapter>('chapterChanged', {
          detail: chapter,
          bubbles: true,
          cancelable: false,
          composed: false,
        })
      );
    });
    listItem.appendChild(linkElem);
    return listItem;
    // return cmp.createListItem(
    //     ownerDocument,
    //     chapter.getDisplayName(),
    //     this.getChapterNodeIdentifier(chapter),
    //     (e) => dispatchEvent(new CustomEvent<model.Chapter>(
    //         'chapterChanged', {
    //         detail: chapter,
    //         bubbles: true,
    //         cancelable: false,
    //         composed: false
    //     })));
  }
}
