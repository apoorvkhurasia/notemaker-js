import * as model from '../lib/model';
import * as cmp from './components';

export class ExplorerView
  implements model.ChapterObserver, model.TopicObserver
{
  private htmlRootElem: HTMLUListElement;
  private activeChapter: HTMLLIElement | null = null;

  public constructor(htmlRootElem: HTMLUListElement) {
    this.htmlRootElem = htmlRootElem;
  }

  public init(topics: Array<model.Topic>): void {
    const ownerDocument = this.htmlRootElem.ownerDocument;
    while (this.htmlRootElem.firstChild !== null) {
      this.htmlRootElem.removeChild(this.htmlRootElem.firstChild);
    }
    for (const topic of topics) {
      this.htmlRootElem.appendChild(
        this.createTopicElement(topic, ownerDocument)
      );
    }
  }

  public onChapterSelected(chapter: model.Chapter): void {
    const ownerDocument = this.htmlRootElem.ownerDocument;
    const chapterElem = <HTMLLIElement>(
      ownerDocument.getElementById(this.getChapterNodeIdentifier(chapter))
    );
    chapterElem?.classList.add('selected');
    this.activeChapter?.classList.remove('selected');
    this.activeChapter = chapterElem;
  }

  public onTopicRemoved(topic: model.Topic): void {
    const ownerDocument = this.htmlRootElem.ownerDocument;
    const topicElem = ownerDocument.getElementById(
      this.getTopicNodeIdentifier(topic)
    );
    if (topicElem !== null) {
      this.htmlRootElem.removeChild(topicElem);
    }
  }

  public onTopicCreated(topic: model.Topic): void {
    const ownerDocument = this.htmlRootElem.ownerDocument;
    this.htmlRootElem.appendChild(
      this.createTopicElement(topic, ownerDocument)
    );
  }

  public onChapterCreated(chapter: model.Chapter): void {
    const ownerDocument = this.htmlRootElem.ownerDocument;
    let topicElem = ownerDocument.getElementById(
      this.getTopicNodeIdentifier(chapter.getTopic())
    );
    if (topicElem === null) {
      topicElem = this.createTopicElement(chapter.getTopic(), ownerDocument);
    }

    const chapterListElement = ownerDocument.getElementById(
      this.getTopicNodeIdentifier(chapter.getTopic()) + '-chplist'
    );
    chapterListElement?.appendChild(
      this.createChapterElement(chapter, ownerDocument)
    );
  }

  public onChapterMove(chapter: model.Chapter, oldTopic: model.Topic): void {
    //TODO: Implement when adding support for drag drop
  }

  private createTopicElement(
    topic: model.Topic,
    ownerDocument: Document
  ): HTMLLIElement {
    const topicElem = <HTMLLIElement>ownerDocument.createElement('li');
    topicElem.id = this.getTopicNodeIdentifier(topic);
    topicElem.classList.add('topic');
    const topicDetails = ownerDocument.createElement('details');
    const topicSummary = ownerDocument.createElement('summary');
    const topicSummarySpan = ownerDocument.createElement('span');
    topicSummarySpan.innerText = topic.getDisplayName();
    topicSummary.appendChild(topicSummarySpan);
    topicDetails.appendChild(topicSummary);

    const chapterListElem = <HTMLUListElement>ownerDocument.createElement('ul');
    chapterListElem.id = this.getTopicNodeIdentifier(topic) + '-chplist';

    const chapterElems = topic
      .getChapters()
      .map(chapter => this.createChapterElement(chapter, ownerDocument));
    chapterElems.forEach(el => chapterListElem.appendChild(el));

    topicDetails.appendChild(chapterListElem);
    topicElem.appendChild(topicDetails);
    return topicElem;
  }

  private createChapterElement(
    chapter: model.Chapter,
    ownerDocument: Document
  ): HTMLLIElement {
    const elem = <HTMLLIElement>cmp.createListItem(
      ownerDocument,
      chapter.getDisplayName(),
      this.getChapterNodeIdentifier(chapter),
      elem =>
        elem.dispatchEvent(
          new CustomEvent<model.Chapter>('chapterChanged', {
            detail: chapter,
            bubbles: true,
            cancelable: false,
            composed: false,
          })
        ),
      null
    );
    elem.classList.add('chapter');
    return elem;
  }

  private getTopicNodeIdentifier(topic: model.Topic): string {
    return 'topic-' + topic.getId();
  }

  private getChapterNodeIdentifier(chapter: model.Chapter): string {
    return 'chapter-' + chapter.getTopic().getId() + '-' + chapter.getId();
  }

  private getChapterNode(chapter: model.Chapter): HTMLLIElement | null {
    return this.htmlRootElem.ownerDocument.getElementById(
      this.getChapterNodeIdentifier(chapter)
    ) as HTMLLIElement;
  }

  private getTopicNode(topic: model.Topic): HTMLLIElement | null {
    return this.htmlRootElem.ownerDocument.getElementById(
      this.getTopicNodeIdentifier(topic)
    ) as HTMLLIElement;
  }
}
