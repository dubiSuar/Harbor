import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  View,
  type TextInputInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommentRow, CommentsSkeleton } from '../components/post/CommentRow';
import { CommentSummaryCard } from '../components/post/CommentSummaryCard';
import { fmtCount } from '../components/post/format';
import { PostDetailBody } from '../components/post/PostDetailBody';
import { PostSkeleton } from '../components/feed/FeedSkeleton';
import {
  Avatar,
  ComposerBar,
  EmptyState,
  ErrorState,
  Header,
  Icon,
  PressableScale,
  useToast,
  useToastKeyboardBar,
} from '../components/ui';
import { postTime } from '../data/time';
import { firstNameOf, type Comment } from '../data/types';
import { useIsTopScreen, useNav, useScreenKey } from '../navigation/Navigator';
import { useOpenProfile } from '../navigation/useOpenProfile';
import {
  useCommentLikes,
  useCommentSummary,
  useMe,
  usePeople,
} from '../state/SocialContext';
import { useComments, usePost, useStore } from '../state/StoreContext';
import type { Live } from '../state/storeTypes';
import { colors, duration, fonts, type } from '../theme';
import { messageOf } from '../utils/errors';

/** Matches validateComment() and the Firestore rules. */
const COMMENT_MAX = 500;
/** Compact header bar under the status bar (the design's 98 - 50). */
const BAR = 48;

const COMMENTS_LOADING: Live<Comment[]> = { data: [], state: 'loading' };

/** The sort row: the thread's own order, or newest first. */
type Sort = 'relevant' | 'newest';
const SORT_LABEL: Record<Sort, string> = {
  relevant: 'Most relevant',
  newest: 'Newest',
};

/** The 36-tall sort row, padded to a 44 target. */
const SORT_SLOP = { top: 4, bottom: 4 };

type Props = { postId: string; focusComment?: boolean };

/**
 * Owns the live comments subscription. The live hooks have no retry, so
 * "Try again" remounts this (by bumping its key) to subscribe afresh.
 */
function CommentsSubscriber({
  postId,
  onChange,
}: {
  postId: string;
  onChange: (live: Live<Comment[]>) => void;
}) {
  const live = useComments(postId);
  useEffect(() => {
    onChange(live);
  }, [live, onChange]);
  return null;
}

/**
 * Post detail (SPEC 3.05): the post with its photo row and counts, the AI
 * comment summary, the sort row and the comment thread, under a
 * translucent compact header and over the frosted comment composer. The
 * thread is one virtualised list with the post as its header.
 */
export function PostScreen({ postId, focusComment }: Props) {
  const nav = useNav();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const isTop = useIsTopScreen();
  const openAuthor = useOpenProfile();
  const { meId, toggleLike, addComment } = useStore();
  const me = useMe();
  const person = usePeople();
  const postLive = usePost(postId);
  const summary = useCommentSummary(postId);
  const commentLikes = useCommentLikes();
  const [commentsLive, setCommentsLive] =
    useState<Live<Comment[]>>(COMMENTS_LOADING);
  const [commentsAttempt, setCommentsAttempt] = useState(0);
  const [draft, setDraft] = useState('');
  const [composerH, setComposerH] = useState(0);
  const [sort, setSort] = useState<Sort>('relevant');
  const inputRef = useRef<TextInputInstance>(null);
  const listRef = useRef<FlatList<Comment>>(null);

  // With the keyboard up, toasts sit above the composer riding on it.
  useToastKeyboardBar(composerH, isTop);

  const mounted = useRef(true);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current);
      }
    };
  }, []);

  const post = postLive.data;
  const comments = commentsLive.data;
  // The store merges my in-flight comments into the list (c.pending), so
  // they show exactly once, faded, until the server copy replaces them.
  const sending = comments.some(c => c.pending);
  const author = post ? person(post.authorId) : undefined;
  const sorted = useMemo(
    () =>
      sort === 'newest'
        ? [...comments].sort((a, b) => b.createdAt - a.createdAt)
        : comments,
    [comments, sort],
  );

  // If the post goes away while we're looking at it (deleted), step back.
  // A post that was never there keeps the "not available" message instead.
  const hadPost = useRef(false);
  const gone = postLive.state === 'ready' && !post;
  const { dismiss } = nav;
  const screenKey = useScreenKey();
  useEffect(() => {
    if (post) {
      hadPost.current = true;
    } else if (gone && hadPost.current) {
      hadPost.current = false;
      dismiss(screenKey);
    }
  }, [post, gone, dismiss, screenKey]);

  // `focusComment`: open the keyboard once the push has settled.
  useEffect(() => {
    if (!focusComment) {
      return;
    }
    const t = setTimeout(() => inputRef.current?.focus(), duration.push);
    return () => clearTimeout(t);
  }, [focusComment]);

  const retryComments = useCallback(() => {
    setCommentsLive(COMMENTS_LOADING);
    setCommentsAttempt(n => n + 1);
  }, []);

  // ComposerBar is `disabled` while there is no post or a comment is in
  // flight, so this only runs with a post and a clean draft.
  const sortRef = useRef(sort);
  sortRef.current = sort;
  const send = useCallback(
    async (text: string) => {
      setDraft('');
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current);
      }
      // My comment lands at the end of the thread, or first when newest.
      scrollTimer.current = setTimeout(() => {
        if (sortRef.current === 'newest') {
          listRef.current?.scrollToIndex({
            index: 0,
            viewPosition: 0.5,
            animated: true,
          });
        } else {
          listRef.current?.scrollToEnd({ animated: true });
        }
      }, 50);
      try {
        await addComment(postId, text);
      } catch (e) {
        if (mounted.current) {
          // Put the words back so nothing typed is lost.
          setDraft(current => (current.trim() ? current : text));
          toast.show(messageOf(e, "Couldn't post your comment."), {
            icon: 'warning-circle',
          });
        }
      }
    },
    [addComment, postId, toast],
  );

  const focusComposer = useCallback(() => inputRef.current?.focus(), []);

  const like = useCallback(
    (id: string) => {
      toggleLike(id).catch(e =>
        toast.show(messageOf(e, "Couldn't update that like."), {
          icon: 'warning-circle',
        }),
      );
    },
    [toggleLike, toast],
  );

  const share = useCallback(() => toast.show('Link copied'), [toast]);

  const { refresh } = summary;
  const refreshSummary = useCallback(() => {
    refresh().catch(() =>
      toast.show("Couldn't reach Harbor AI", { icon: 'warning-circle' }),
    );
  }, [refresh, toast]);

  const toggleSort = useCallback(
    () => setSort(s => (s === 'relevant' ? 'newest' : 'relevant')),
    [],
  );

  const { toggle: toggleCommentLike, isLiked, countOf } = commentLikes;
  const reply = useCallback(
    (authorId: string) => {
      setDraft(`@${firstNameOf(person(authorId).name)} `);
      inputRef.current?.focus();
    },
    [person],
  );

  const renderItem = useCallback(
    ({ item: c }: { item: Comment }) => {
      const mine = c.pending || c.authorId === meId;
      return (
        <CommentRow
          commentId={c.id}
          authorId={c.authorId}
          author={mine ? me : person(c.authorId)}
          text={c.text}
          time={postTime(c.createdAt)}
          liked={isLiked(c.id)}
          likes={countOf(c)}
          pending={!!c.pending}
          onLike={toggleCommentLike}
          onReply={reply}
          onAuthor={openAuthor}
        />
      );
    },
    [meId, me, person, isLiked, countOf, toggleCommentLike, reply, openAuthor],
  );

  const title = author ? `${firstNameOf(author.name)}'s post` : 'Post';

  const header =
    post && author ? (
      <>
        <PostDetailBody
          post={post}
          author={author}
          onLike={like}
          onDoubleTapLike={like}
          onComment={focusComposer}
          onShare={share}
          onAuthor={openAuthor}
        />

        {summary.enabled ? (
          <CommentSummaryCard
            countText={fmtCount(post.commentCount)}
            text={summary.displayText}
            loading={summary.loading}
            onRefresh={refreshSummary}
          />
        ) : null}

        <PressableScale
          onPress={toggleSort}
          pressedScale={0.99}
          hitSlop={SORT_SLOP}
          accessibilityLabel={`Sort comments: ${SORT_LABEL[sort]}`}
          accessibilityHint={`Switches to ${
            SORT_LABEL[sort === 'relevant' ? 'newest' : 'relevant']
          }`}
          style={styles.sort}
        >
          <Text style={styles.sortLabel}>{SORT_LABEL[sort]}</Text>
          <Icon name="caret-down" size={16} color={colors.muted} />
        </PressableScale>
      </>
    ) : postLive.state === 'loading' ? (
      <PostSkeleton />
    ) : postLive.state === 'error' ? (
      <ErrorState
        title="Couldn't load this post"
        message={postLive.error ?? 'Check your connection and try again.'}
        onRetry={nav.pop}
        retryLabel="Go back"
      />
    ) : (
      <EmptyState
        icon="warning-circle"
        title="This post isn't available anymore."
        actionLabel="Go back"
        onAction={nav.pop}
      />
    );

  const empty = !post ? undefined : commentsLive.state === 'loading' ? (
    <CommentsSkeleton />
  ) : commentsLive.state === 'error' ? (
    <ErrorState
      title="Couldn't load comments"
      message={commentsLive.error ?? 'Check your connection and try again.'}
      onRetry={retryComments}
    />
  ) : undefined;

  return (
    <View style={styles.flex}>
      <CommentsSubscriber
        key={commentsAttempt}
        postId={postId}
        onChange={setCommentsLive}
      />
      {/* 'padding' on both platforms: Android runs edge-to-edge, so the
          window is not resized for the keyboard. The composer rides the
          keyboard by itself, so only the list is avoided. */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <FlatList
          ref={listRef}
          style={styles.flex}
          data={post ? sorted : []}
          keyExtractor={keyOf}
          renderItem={renderItem}
          ListHeaderComponent={header}
          ListEmptyComponent={empty}
          ItemSeparatorComponent={Gap}
          onScrollToIndexFailed={() =>
            listRef.current?.scrollToOffset({ offset: 0, animated: true })
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          windowSize={9}
          contentContainerStyle={{
            paddingTop: insets.top + BAR,
            paddingBottom: composerH + 10,
          }}
        />
      </KeyboardAvoidingView>

      <Header variant="compact" title={title} onBack={nav.pop} />

      <ComposerBar
        ref={inputRef}
        tone="post"
        value={draft}
        onChangeText={setDraft}
        onSend={send}
        maxLength={COMMENT_MAX}
        disabled={!post || sending}
        placeholder="Write a comment…"
        accessibilityLabel="Write a comment"
        left={<Avatar uri={me.photoUrl} name={me.name} size={34} />}
        onHeight={setComposerH}
      />
    </View>
  );
}

const keyOf = (c: Comment) => c.id;

/** The thread's 4dp gap between comments. */
function Gap() {
  return <View style={styles.gap} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  sort: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  sortLabel: { ...type.name, fontFamily: fonts.semibold, letterSpacing: 0 },
  gap: { height: 4 },
});
