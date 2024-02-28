import * as $ from 'jquery';
import * as fs from './lib/fs';
import * as model from './lib/model';
import * as exp from './view/explorer';
import * as cnt from './view/content';

require('./styles/fonts.css');
require('./styles/layout.css');
require('./styles/main.css');

enum CreateMode {
  TOPIC,
  CHAPTER,
}

type EditorState = {
  createMode: CreateMode;
  currStoreDirectoryHandle: FileSystemDirectoryHandle;
  currentChapter: model.Chapter | null;
};

type DocumentTree = {
  explorerItems: HTMLUListElement;
  mdInput: HTMLTextAreaElement;
  previewArea: HTMLElement;
  openStoreLink: HTMLAnchorElement;
  newChapterLink: HTMLAnchorElement;
  newTopicLink: HTMLAnchorElement;
  saveChapterLink: HTMLAnchorElement;
  discardChapterLink: HTMLAnchorElement;
};

let documentTree: DocumentTree;
let editorState: EditorState;
let explorer: exp.ExplorerView;
let content: cnt.ContentViewer;

$(() => {
  documentTree = {
    openStoreLink: <HTMLAnchorElement>document.getElementById('open-store'),
    explorerItems: <HTMLUListElement>document.getElementById('explorer-items'),
    mdInput: <HTMLTextAreaElement>document.getElementById('markdownInput'),
    previewArea: <HTMLElement>document.getElementById('preview'),
    newChapterLink: <HTMLAnchorElement>document.getElementById('new-chapter'),
    newTopicLink: <HTMLAnchorElement>document.getElementById('new-topic'),
    saveChapterLink: <HTMLAnchorElement>document.getElementById('save-chapter'),
    discardChapterLink: <HTMLAnchorElement>(
      document.getElementById('discard-chapter')
    ),
  };

  explorer = new exp.ExplorerView(documentTree.explorerItems);
  content = new cnt.ContentViewer(
    documentTree.mdInput,
    documentTree.previewArea
  );

  documentTree.openStoreLink.addEventListener(
    'click',
    async () => await openStore()
  );

  documentTree.explorerItems.addEventListener(
    'chapterChanged',
    async (ev: Event) =>
      await displayChapter((<CustomEvent<model.Chapter>>ev).detail)
  );
  documentTree.newTopicLink.addEventListener('click', () =>
    initCreate(CreateMode.TOPIC)
  );
  documentTree.newChapterLink.addEventListener('click', () =>
    initCreate(CreateMode.CHAPTER)
  );
  documentTree.saveChapterLink.addEventListener(
    'click',
    async () => await saveCurrentChapter()
  );
  documentTree.discardChapterLink.addEventListener('click', async () => {
    if (editorState.currentChapter !== null) {
      await displayChapter(editorState.currentChapter);
    }
  });

  $(documentTree.newTopicLink).hide();
  $(documentTree.newChapterLink).hide();
  $(documentTree.saveChapterLink).hide();
  $(documentTree.discardChapterLink).hide();
});

async function saveCurrentChapter(): Promise<void> {
  if (editorState.currentChapter !== null) {
    const markdownInputArea = document.getElementById(
      'markdownInput'
    ) as HTMLTextAreaElement;
    await fs.saveChapter(
      editorState.currStoreDirectoryHandle,
      editorState.currentChapter,
      markdownInputArea.value
    );
  }
}

function initCreate(mode: CreateMode): void {
  editorState.createMode = mode;
}

async function finishCreateChapterOrTopic(): Promise<void> {
  const contentRootHandle = editorState.currStoreDirectoryHandle;
  const userInput = $('#topic-or-chapter-input').val();
  if (typeof userInput === 'string') {
    switch (editorState.createMode) {
      case CreateMode.TOPIC:
        explorer.onTopicCreated(
          await fs.createNewTopic(contentRootHandle, userInput)
        );
        break;
      case CreateMode.CHAPTER:
        if (editorState.currentChapter !== null) {
          const currentTopic = editorState.currentChapter.getTopic();
          const chapter = await fs.createNewChapter(
            contentRootHandle,
            currentTopic,
            userInput
          );
          if (chapter !== null) {
            explorer.onChapterCreated(chapter);
            displayChapter(chapter);
          }
        }
        break;
      default:
        break;
    }
  }
}

async function openStore(): Promise<void> {
  const storeDirectoryHandle = await window.showDirectoryPicker();
  editorState = {
    createMode: CreateMode.TOPIC,
    currStoreDirectoryHandle: storeDirectoryHandle,
    currentChapter: null,
  };
  $(documentTree.newTopicLink).show();

  const topics = await fs.getTopics(storeDirectoryHandle);
  topics.sort();
  explorer.init(topics);
  await content.setContent('');
}

async function displayChapter(chapter: model.Chapter): Promise<void> {
  editorState.currentChapter = chapter;
  explorer.onChapterSelected(chapter);
  if (chapter !== null) {
    const rawText = await fs.getChapterRawText(
      editorState.currStoreDirectoryHandle,
      chapter
    );
    await content.setContent(rawText);
  }
  $('#new-chapter').show();
  $('#save-chapter').show();
  $('#discard-chapter').show();
}
