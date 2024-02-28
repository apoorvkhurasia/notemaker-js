export function createListItem(
  document: Document,
  displayText: string,
  identifier: string,
  clickAction: null | ((clickedElem: Element, ev: Event) => unknown)
): HTMLLIElement {
  const listItem = <HTMLLIElement>document.createElement('li');
  listItem.id = identifier;
  if (clickAction !== null) {
    const linkElem = document.createElement('a');
    const spanElem = document.createElement('span');
    spanElem.style.display = 'block';
    spanElem.appendChild(document.createTextNode(displayText));
    linkElem.appendChild(spanElem);
    linkElem.addEventListener('click', e => clickAction(linkElem, e));
    listItem.appendChild(linkElem);
  }
  return listItem;
}
