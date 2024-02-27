import * as $ from 'jquery';

export function toggleElemVisibility(element: Element): void {
  const selector = $(element);
  if (selector.is(':visible')) {
    selector.hide(250);
  } else {
    selector.show(250);
  }
}

export function createListItem(
  document: Document,
  displayText: string,
  identifier: string,
  clickAction: (clickedElem: Element, ev: Event) => unknown
): Element {
  const listItem = document.createElement('li');
  listItem.id = identifier;
  if (clickAction !== null) {
    const linkElem = document.createElement('a');
    linkElem.appendChild(document.createTextNode(displayText));
    linkElem.addEventListener('click', e => clickAction(linkElem, e));
    listItem.appendChild(linkElem);
  }
  return listItem;
}
