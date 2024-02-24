export class Topic {
    private id: string;
    private displayName: string;
    private chapters: Array<Chapter> = [];

    public constructor(id: string, displayName: string) {
        this.id = id;
        this.displayName = displayName;
    }

    public getId(): string {
        return this.id;
    }

    public getDisplayName(): string {
        return this.displayName;
    }

    public setDisplayName(newName: string): void {
        this.displayName = newName;
    }

    public addChapter(chapter: Chapter): void {
        this.chapters.push(chapter);
    }

    public removeChapter(chapter: Chapter): void {
        const index = this.chapters.indexOf(chapter);
        if (index > -1) {
            this.chapters.splice(index, 1);
        }
    }

    public getChapters(): Array<Chapter> {
        return this.chapters;
    }
}

export class Chapter {
    private id: string;
    private displayName: string;
    private topic: Topic; //backlink
    private observers: Array<ChapterObserver> = [];

    public constructor(id: string, displayName: string, observers: Array<ChapterObserver>) {
        this.id = id;
        this.displayName = displayName;
        this.topic = null;
        observers.forEach(o => this.observers.push(o));
    }

    public getId(): string {
        return this.id;
    }

    public getDisplayName(): string {
        return this.displayName;
    }

    public setDisplayName(newName: string): void {
        this.displayName = newName;
    }

    public getTopic(): Topic {
        return this.topic;
    }

    public moveTo(newTopic: Topic): void {
        const oldTopic = this.topic;
        if (oldTopic !== null) {
            oldTopic.removeChapter(this);
        }
        if (newTopic !== null) {
            newTopic.addChapter(this);
        }
        this.topic = newTopic;
        for (const obs of this.observers) {
            try {
                obs.onChapterMove(oldTopic, newTopic);
            } catch (err) {
                //Swallow, the observers shouldn't be throwing them anyway
            }
        }
    }

    public dispose(): void {
        this.moveTo(null);
        this.observers = []; //Clear these out
    }
}

export interface ChapterObserver {
    onChapterMove(oldTopic: Topic, newTopic: Topic): void;
}