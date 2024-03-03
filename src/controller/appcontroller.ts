import {ContentViewer as ContentView} from '../view/content';
import {Explorer} from '../view/explorer';
import {ContentController} from './contentcontroller';
import {Chapter, Topic} from '../model/model';

export class AppController {
  private explorerView: Explorer;
  private contentView: ContentView;
  private contentController: ContentController;

  private currentTopic: Topic | null = null;
  private currentChapter: Chapter | null = null;

  public constructor(
    explorerView: Explorer,
    contentView: ContentView,
    contentController: ContentController
  ) {
    this.explorerView = explorerView;
    this.contentView = contentView;
    this.contentController = contentController;
  }

  public load(): void {
    // this.explorerView.addEventListener('chapterselected', e =>
    //   this.displayChapter((<CustomEvent<Chapter>>e).detail)
    // );
    // this.explorerView.addEventListener('chapterrenamed', e =>
    //   this.renameChapter((<CustomEvent<Chapter>>e).detail)
    // );
    // this.explorerView.addEventListener('topicrenamed', e =>
    //   this.renameTopic((<CustomEvent<Topic>>e).detail)
    // );
  }

  private async createNewTopic(): Promise<void> {
    const topicName = await this.explorerView.requestNewTopicNameFromUser();
    const topicId = Math.floor(100000 + Math.random() * 900000).toString();
    await this.contentController.newTopic(new Topic(topicId, topicName));
  }

  private async createNewChapter(): Promise<void> {
    const topic = this.currentTopic;
    if (topic === null) {
      return;
    }
    const chapterName = await this.explorerView.requestNewChapterNameFromUser();
    const chapterId = Math.floor(100000 + Math.random() * 900000).toString();
    const chapter = new Chapter(chapterId, chapterName);
    topic.addChapter(chapter);
    await this.contentController.newChapter(chapter, '');
  }

  private async deleteCurrentChapter(): Promise<void> {
    const chapter = this.currentChapter;
    const currTopic = this.currentTopic;
    if (chapter !== null) {
      await this.contentController.deleteChapter(chapter);
      if (currTopic !== null) {
        currTopic.removeChapter(chapter);
      }
    }
    this.currentChapter = null;
  }

  private async discardAndReloadCurrentChapter(): Promise<void> {
    const chapter = this.currentChapter;
    if (chapter !== null) {
      const text = await this.contentController.getChapterText(chapter);
      this.contentView.setContent(text);
    }
  }

  private async renameChapter(chapter: Chapter): Promise<void> {
    await this.contentController.renameChapter(
      chapter,
      chapter.getDisplayName()
    );
  }

  private async renameTopic(topic: Topic): Promise<void> {
    await this.contentController.renameTopic(topic, topic.getDisplayName());
  }

  private async saveCurrentChapter(): Promise<void> {
    const chapter = this.currentChapter;
    if (chapter !== null) {
      await this.contentController.updateChapter(
        chapter,
        this.contentView.getContent()
      );
    }
  }

  private async displayChapter(chapter: Chapter): Promise<void> {
    if (chapter !== null) {
      const rawText = await this.contentController.getChapterText(chapter);
      this.contentView.setContent(rawText);
    }
  }
}
