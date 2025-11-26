import { Realm } from '@realm/react';

/**
 * Media embedded object for article images/videos
 */
export class Media extends Realm.Object<Media> {
    url?: string;
    thumbnail?: string;
    type?: string; // 'image' | 'video'

    static schema: Realm.ObjectSchema = {
        name: 'Media',
        embedded: true,
        properties: {
            url: 'string?',
            thumbnail: 'string?',
            type: 'string?',
        },
    };
}

/**
 * Audio file location embedded object
 */
export class AudioLocation extends Realm.Object<AudioLocation> {
    Location?: string;

    static schema: Realm.ObjectSchema = {
        name: 'AudioLocation',
        embedded: true,
        properties: {
            Location: 'string?',
        },
    };
}

/**
 * Language-specific audio files (male/female)
 */
export class LanguageAudio extends Realm.Object<LanguageAudio> {
    male?: AudioLocation;
    female?: AudioLocation;

    static schema: Realm.ObjectSchema = {
        name: 'LanguageAudio',
        embedded: true,
        properties: {
            male: 'AudioLocation?',
            female: 'AudioLocation?',
        },
    };
}

/**
 * Audio files for both languages
 */
export class AudioFiles extends Realm.Object<AudioFiles> {
    en?: LanguageAudio;
    te?: LanguageAudio;

    static schema: Realm.ObjectSchema = {
        name: 'AudioFiles',
        embedded: true,
        properties: {
            en: 'LanguageAudio?',
            te: 'LanguageAudio?',
        },
    };
}

/**
 * Article statistics embedded object
 */
export class Stats extends Realm.Object<Stats> {
    likes_count?: string;
    comments_count?: string;
    views_count?: string;

    static schema: Realm.ObjectSchema = {
        name: 'Stats',
        embedded: true,
        properties: {
            likes_count: 'string?',
            comments_count: 'string?',
            views_count: 'string?',
        },
    };
}

/**
 * Main Article object with TTL support
 * Indexed by article_id for fast lookups
 * Includes day and fetchedAt for TTL-based cleanup
 */
export class Article extends Realm.Object<Article> {
    article_id!: number;
    title_te?: string;
    title_en?: string;
    content_te?: string;
    content_en?: string;
    media?: Media;
    audio_files?: AudioFiles;
    category_id?: number;
    state_id?: number;
    is_breaking!: boolean;
    is_trending!: boolean;
    is_exclusive!: boolean;
    stats?: Stats;
    day!: string; // YYYY-MM-DD format
    fetchedAt!: Date; // For TTL calculation

    static schema: Realm.ObjectSchema = {
        name: 'Article',
        primaryKey: 'article_id',
        properties: {
            article_id: 'int',
            title_te: 'string?',
            title_en: 'string?',
            content_te: 'string?',
            content_en: 'string?',
            media: 'Media?',
            audio_files: 'AudioFiles?',
            category_id: 'int?',
            state_id: 'int?',
            is_breaking: { type: 'bool', default: false, indexed: true },
            is_trending: { type: 'bool', default: false, indexed: true },
            is_exclusive: { type: 'bool', default: false, indexed: true },
            stats: 'Stats?',
            day: { type: 'string', indexed: true }, // Index for day-based queries
            fetchedAt: { type: 'date', indexed: true }, // Index for TTL queries
        },
    };
}

/**
 * Day metadata for pagination tracking
 * Stores cursor and nextDay information per day
 */
export class DayMetadata extends Realm.Object<DayMetadata> {
    _id!: Realm.BSON.ObjectId;
    day!: string; // YYYY-MM-DD
    nextCursor?: string;
    nextDay?: string;
    lastFetchedAt!: Date;

    static schema: Realm.ObjectSchema = {
        name: 'DayMetadata',
        primaryKey: '_id',
        properties: {
            _id: 'objectId',
            day: { type: 'string', indexed: true },
            nextCursor: 'string?',
            nextDay: 'string?',
            lastFetchedAt: 'date',
        },
    };
}
