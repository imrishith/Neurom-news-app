import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useArticlesStore, ArticleListItem, FullArticle } from '../../../utils/store/useArticlesStore';
import ArticleShell from '../../components/ArticleShell';
import ArticleTextMode from './ArticleTextMode';
import ArticleAudioMode from './ArticleAudioMode';

interface ArticlePageProps {
    item: ArticleListItem;
    index: number;
    isVisible: boolean;
    isTextMode: boolean;
    currentVisibleIndex: number;
    totalPosts: number;
    colors: any;
    t: any;
    getFont: any;
    getLangCode: any;
    deviceId: string;
    activeTab: string;
    onShare: () => void;
    onComment: () => void;
    onReport: () => void;
    onToggleMode: (mode: boolean) => void;
    setFullVideo: (video: { uri: string; poster: string } | null) => void;
    posts: ArticleListItem[];
    onSelectArticle?: (article: any, index: number) => void;
    modeSwitchVersion?: number;
}

/**
 * ArticlePage - Smart wrapper that:
 * 1. Renders ArticleShell instantly with lightweight data
 * 2. Fetches full content when visible
 * 3. Renders ArticleTextMode/AudioMode when loaded
 */
const ArticlePage: React.FC<ArticlePageProps> = ({
    item,
    index,
    isVisible,
    isTextMode,
    currentVisibleIndex,
    totalPosts,
    colors,
    t,
    getFont,
    getLangCode,
    deviceId,
    activeTab,
    onShare,
    onComment,
    onReport,
    onToggleMode,
    setFullVideo,
    posts,
    onSelectArticle,
    modeSwitchVersion = 0,
}) => {
    const { fetchFullArticle, articleCache } = useArticlesStore();
    const [fullArticle, setFullArticle] = useState<FullArticle | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch full article when page becomes visible
    useEffect(() => {
        if (isVisible && !fullArticle) {
            // Check cache first
            const cached = articleCache[item.article_id];
            if (cached) {
                setFullArticle(cached);
            } else {
                // Fetch from API
                setIsLoading(true);
                fetchFullArticle(item.article_id).then((article) => {
                    if (article) {
                        setFullArticle(article);
                    }
                    setIsLoading(false);
                });
            }
        }
    }, [isVisible, item.article_id, fullArticle, articleCache, fetchFullArticle]);

    // Get title based on language
    const title = getLangCode() === 'te' ? item.title_te : item.title_en;

    // Create a merged article object that combines lightweight item with full data
    const articleData = fullArticle || {
        ...item,
        // Provide fallback values for missing fields
        content_en: '',
        content_te: '',
        audio_files: null,
        media: item.thumbnail ? { url: item.thumbnail, thumbnail: item.thumbnail, type: 'image' } : null,
        Category: item.category ? { name_en: item.category, name_te: item.category } : null,
    };

    // If full article not loaded, show shell
    if (!fullArticle) {
        return (
            <ArticleShell
                title={title}
                thumbnail={item.thumbnail}
                isLoading={isLoading}
                colors={colors}
            />
        );
    }

    // Render full article
    return (
        <View style={{ flex: 1 }}>
            {isTextMode ? (
                <ArticleTextMode
                    article={articleData}
                    index={index}
                    isVisible={index === currentVisibleIndex}
                    totalPosts={totalPosts}
                    colors={colors}
                    t={t}
                    getFont={getFont}
                    getLangCode={getLangCode}
                    deviceId={deviceId}
                    onShare={onShare}
                    onComment={onComment}
                    onReport={onReport}
                    onToggleMode={onToggleMode}
                    isTextMode={isTextMode}
                    activeTab={activeTab}
                    stats={{ views: 0, likes: 0, shares: 0, comments: 0 }}
                />
            ) : (
                <ArticleAudioMode
                    article={articleData}
                    index={index}
                    totalPosts={totalPosts}
                    colors={colors}
                    t={t}
                    getFont={getFont}
                    getLangCode={getLangCode}
                    deviceId={deviceId}
                    onShare={onShare}
                    onComment={onComment}
                    onReport={onReport}
                    onToggleMode={onToggleMode}
                    isTextMode={isTextMode}
                    activeTab={activeTab}
                    posts={posts}
                    currentIndex={currentVisibleIndex}
                    onSelectArticle={onSelectArticle || (() => { })}
                    modeSwitchVersion={modeSwitchVersion}
                    stats={{ views: 0, likes: 0, shares: 0, comments: 0 }}
                />
            )}
        </View>
    );
};

export default ArticlePage;
