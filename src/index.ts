import * as $ from 'jquery';
import * as fs from './lib/fs';
import * as model from './lib/model';
import * as exp from './view/explorer';
import * as cnt from './view/content';

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
  explorerItems: HTMLElement;
  mdInput: HTMLTextAreaElement;
  previewArea: HTMLElement;
  openStoreLink: HTMLAnchorElement;
  newChapterLink: HTMLAnchorElement;
  newTopicLink: HTMLAnchorElement;
  saveChapterLink: HTMLAnchorElement;
  discardChapterLink: HTMLAnchorElement;
  topicOrChapterNameConfirmBtn: HTMLButtonElement;
  topicOrChapterCancelCreationBtn: HTMLButtonElement;
};

let documentTree: DocumentTree;
let editorState: EditorState;
let explorer: exp.ExplorerView;
let content: cnt.ContentViewer;

$(() => {
  documentTree = {
    openStoreLink: document.getElementById('open-store') as HTMLAnchorElement,
    explorerItems: document.getElementById('explorer-items') as HTMLElement,
    mdInput: document.getElementById('markdownInput') as HTMLTextAreaElement,
    previewArea: document.getElementById('preview') as HTMLElement,
    newChapterLink: document.getElementById('new-chapter') as HTMLAnchorElement,
    newTopicLink: document.getElementById('new-topic') as HTMLAnchorElement,
    saveChapterLink: document.getElementById(
      'save-chapter'
    ) as HTMLAnchorElement,
    discardChapterLink: document.getElementById(
      'discard-chapter'
    ) as HTMLAnchorElement,
    topicOrChapterNameConfirmBtn: document.getElementById(
      'confirmTopicOrChapterCreationBtn'
    ) as HTMLButtonElement,
    topicOrChapterCancelCreationBtn: document.getElementById(
      'cancelCreateTopicOrChapterBtn'
    ) as HTMLButtonElement,
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
  $('#topic-or-chapter-input-form').hide();
  $(documentTree.saveChapterLink).hide();
  $(documentTree.discardChapterLink).hide();

  documentTree.topicOrChapterNameConfirmBtn.addEventListener('click', () =>
    finishCreateChapterOrTopic()
  );

  documentTree.topicOrChapterCancelCreationBtn.addEventListener('click', () =>
    cancelCreateTopicOrChapter()
  );
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
  $('#topic-or-chapter-input').val('');
  $('#topic-or-chapter-input-label').val('Topic Name');
  $('#topic-or-chapter-input-form').show();
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
  $('#topic-or-chapter-input-form').hide();
}

async function cancelCreateTopicOrChapter(): Promise<void> {
  $('#topic-or-chapter-input-form').hide();
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
  content.setContent('');
}

async function displayChapter(chapter: model.Chapter): Promise<void> {
  editorState.currentChapter = chapter;
  if (chapter !== null) {
    const rawText = await fs.getChapterRawText(
      editorState.currStoreDirectoryHandle,
      chapter
    );
    content.setContent(rawText);
  }
  $('#new-chapter').show();
  $('#save-chapter').show();
  $('#discard-chapter').show();
}
