import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/supabase_generated_types";
import { getForumMediaSignedUrl } from "@/lib/storage/forums";

export type ForumRole = "job_seeker" | "company" | "admin";
export type ForumProfile = Pick<
  Tables<"profiles">,
  "id" | "first_name" | "last_name" | "username" | "avatar_url" | "role"
>;

export type ForumListItem = Tables<"forums"> & {
  post_count: number;
  comment_count: number;
  latest_activity_at: string | null;
};

export type ForumRequestItem = Tables<"forum_creation_requests">;

export type ForumPostSummary = Tables<"forum_posts"> & {
  score: number;
  comment_count: number;
  author_display: string;
  author_username: string | null;
  real_author_display?: string;
  real_author_username?: string | null;
  first_image_url: string | null;
};

export type ForumPostImage = Tables<"forum_post_images"> & {
  signed_url: string | null;
};

export type ForumCommentItem = Tables<"forum_comments"> & {
  score: number;
  current_user_vote: number | null;
  author_display: string;
  author_username: string | null;
  real_author_display?: string;
  real_author_username?: string | null;
  replies: ForumCommentItem[];
};

export type ForumPostDetail = ForumPostSummary & {
  images: ForumPostImage[];
  comments: ForumCommentItem[];
  current_user_vote: number | null;
};

export type AdminForumReport = Tables<"forum_reports"> & {
  reporter_name: string;
  target_label: string;
  target_href: string | null;
  target_author_name: string;
  target_author_id: string | null;
  target_author_username: string | null;
  target_is_anonymous: boolean;
  target_is_hidden: boolean;
};

export type AdminForumsDashboard = {
  requests: Array<ForumRequestItem & { requester_name: string; requester_username: string | null }>;
  forums: ForumListItem[];
  reports: AdminForumReport[];
};

type Supabase = SupabaseClient<Database>;

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient<Database>(url, key);
}

export function slugifyForumName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fullName(profile: Pick<ForumProfile, "first_name" | "last_name" | "username"> | null | undefined) {
  if (!profile) return "Unknown user";
  return `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || profile.username || "Unknown user";
}

function authorDisplay(
  profile: ForumProfile | null | undefined,
  isAnonymous: boolean,
  viewerRole: string | null | undefined,
) {
  const realName = fullName(profile);
  if (isAnonymous && viewerRole !== "admin") {
    return {
      author_display: "Anonymous Job Seeker",
      author_username: null,
    };
  }

  return {
    author_display: isAnonymous ? "Anonymous Job Seeker" : realName,
    author_username: isAnonymous ? null : profile?.username ?? null,
    real_author_display: viewerRole === "admin" ? realName : undefined,
    real_author_username: viewerRole === "admin" ? profile?.username ?? null : undefined,
  };
}

async function getCurrentForumUser(supabase: Supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, username, avatar_url, role")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile: (profile as ForumProfile | null) ?? null };
}

async function enrichForums(supabase: Supabase, forums: Tables<"forums">[]): Promise<ForumListItem[]> {
  if (forums.length === 0) return [];

  const forumIds = forums.map((forum) => forum.id);
  const { data: postsData } = await supabase
    .from("forum_posts")
    .select("id, forum_id, created_at")
    .in("forum_id", forumIds)
    .eq("is_hidden", false);

  const posts = (postsData ?? []) as Pick<Tables<"forum_posts">, "id" | "forum_id" | "created_at">[];
  const postIds = posts.map((post) => post.id);
  const postCount = new Map<string, number>();
  const latest = new Map<string, string>();

  for (const post of posts) {
    postCount.set(post.forum_id, (postCount.get(post.forum_id) ?? 0) + 1);
    const current = latest.get(post.forum_id);
    if (!current || new Date(post.created_at) > new Date(current)) {
      latest.set(post.forum_id, post.created_at);
    }
  }

  const commentCount = new Map<string, number>();
  if (postIds.length > 0) {
    const { data: commentsData } = await supabase
      .from("forum_comments")
      .select("post_id, created_at")
      .in("post_id", postIds)
      .eq("is_hidden", false);

    const comments = (commentsData ?? []) as Pick<Tables<"forum_comments">, "post_id" | "created_at">[];
    const postForum = new Map(posts.map((post) => [post.id, post.forum_id]));
    for (const comment of comments) {
      const forumId = postForum.get(comment.post_id);
      if (!forumId) continue;
      commentCount.set(forumId, (commentCount.get(forumId) ?? 0) + 1);
      const current = latest.get(forumId);
      if (!current || new Date(comment.created_at) > new Date(current)) {
        latest.set(forumId, comment.created_at);
      }
    }
  }

  return forums.map((forum) => ({
    ...forum,
    post_count: postCount.get(forum.id) ?? 0,
    comment_count: commentCount.get(forum.id) ?? 0,
    latest_activity_at: latest.get(forum.id) ?? null,
  }));
}

async function getProfiles(supabase: Supabase, ids: string[]) {
  const uniqueIds = [...new Set(ids)].filter(Boolean);
  if (uniqueIds.length === 0) return new Map<string, ForumProfile>();

  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, username, avatar_url, role")
    .in("id", uniqueIds);

  return new Map(((data ?? []) as ForumProfile[]).map((profile) => [profile.id, profile]));
}

async function enrichPosts(
  supabase: Supabase,
  posts: Tables<"forum_posts">[],
  viewerRole: string | null | undefined,
): Promise<ForumPostSummary[]> {
  if (posts.length === 0) return [];

  const postIds = posts.map((post) => post.id);
  const [profiles, votesRes, commentsRes, imagesRes] = await Promise.all([
    getProfiles(supabase, posts.map((post) => post.author_id)),
    supabase.from("forum_votes").select("target_id, value").eq("target_type", "post").in("target_id", postIds),
    supabase.from("forum_comments").select("post_id").in("post_id", postIds).eq("is_hidden", false),
    supabase
      .from("forum_post_images")
      .select("post_id, storage_path, sort_order")
      .in("post_id", postIds)
      .order("sort_order", { ascending: true }),
  ]);

  const scores = new Map<string, number>();
  for (const vote of votesRes.data ?? []) {
    scores.set(vote.target_id, (scores.get(vote.target_id) ?? 0) + vote.value);
  }

  const commentCounts = new Map<string, number>();
  for (const comment of commentsRes.data ?? []) {
    commentCounts.set(comment.post_id, (commentCounts.get(comment.post_id) ?? 0) + 1);
  }

  const firstImagePath = new Map<string, string>();
  for (const image of imagesRes.data ?? []) {
    if (!firstImagePath.has(image.post_id)) firstImagePath.set(image.post_id, image.storage_path);
  }

  const signedUrlEntries = await Promise.all(
    [...firstImagePath.entries()].map(async ([postId, path]) => [
      postId,
      await getForumMediaSignedUrl(path, 3600),
    ] as const),
  );
  const signedUrls = new Map(signedUrlEntries);

  return posts.map((post) => ({
    ...post,
    score: scores.get(post.id) ?? 0,
    comment_count: commentCounts.get(post.id) ?? 0,
    first_image_url: signedUrls.get(post.id) ?? null,
    ...authorDisplay(profiles.get(post.author_id), post.is_anonymous, viewerRole),
  }));
}

export async function getForumsHomeData() {
  const supabase = await createClient();
  const { user, profile } = await getCurrentForumUser(supabase);
  if (!user || !profile) return { role: null, forums: [], requests: [] };

  const { data: forumsData } = await supabase
    .from("forums")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const forums = await enrichForums(supabase, (forumsData ?? []) as Tables<"forums">[]);

  let requests: ForumRequestItem[] = [];
  if (profile.role === "job_seeker") {
    const { data } = await supabase
      .from("forum_creation_requests")
      .select("*")
      .eq("requested_by", user.id)
      .order("created_at", { ascending: false });
    requests = (data ?? []) as ForumRequestItem[];
  }

  return { role: profile.role as ForumRole, forums, requests };
}

export async function getForumFeedData(
  forumSlug: string,
  options?: { sort?: string; query?: string },
) {
  const supabase = await createClient();
  const { profile } = await getCurrentForumUser(supabase);
  const { data: forum } = await supabase
    .from("forums")
    .select("*")
    .eq("slug", forumSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (!forum) return null;

  let query = supabase
    .from("forum_posts")
    .select("*")
    .eq("forum_id", forum.id)
    .eq("is_hidden", false);

  const term = options?.query?.trim();
  if (term) {
    const pattern = `%${term.replace(/[,%()]/g, " ")}%`;
    query = query.or(`title.ilike.${pattern},body.ilike.${pattern}`);
  }

  const { data: postsData } = await query.order("created_at", { ascending: false }).limit(100);
  let posts = await enrichPosts(supabase, (postsData ?? []) as Tables<"forum_posts">[], profile?.role);

  if (options?.sort === "top") {
    posts = posts.sort((a, b) => b.score - a.score || +new Date(b.created_at) - +new Date(a.created_at));
  } else if (options?.sort === "commented") {
    posts = posts.sort((a, b) => b.comment_count - a.comment_count || +new Date(b.created_at) - +new Date(a.created_at));
  }

  return {
    forum: forum as Tables<"forums">,
    posts,
    role: profile?.role as ForumRole | undefined,
  };
}

export async function getForumPostData(forumSlug: string, postId: string) {
  const supabase = await createClient();
  const { user, profile } = await getCurrentForumUser(supabase);

  const { data: forum } = await supabase
    .from("forums")
    .select("*")
    .eq("slug", forumSlug)
    .eq("is_active", true)
    .maybeSingle();
  if (!forum) return null;

  const { data: post } = await supabase
    .from("forum_posts")
    .select("*")
    .eq("id", postId)
    .eq("forum_id", forum.id)
    .eq("is_hidden", false)
    .maybeSingle();
  if (!post) return null;

  const [summary] = await enrichPosts(supabase, [post as Tables<"forum_posts">], profile?.role);

  const { data: imagesData } = await supabase
    .from("forum_post_images")
    .select("*")
    .eq("post_id", post.id)
    .order("sort_order", { ascending: true });

  const images = await Promise.all(
    ((imagesData ?? []) as Tables<"forum_post_images">[]).map(async (image) => ({
      ...image,
      signed_url: await getForumMediaSignedUrl(image.storage_path, 3600),
    })),
  );

  const { data: commentsData } = await supabase
    .from("forum_comments")
    .select("*")
    .eq("post_id", post.id)
    .eq("is_hidden", false)
    .order("created_at", { ascending: true });

  const commentsRaw = (commentsData ?? []) as Tables<"forum_comments">[];
  const profiles = await getProfiles(supabase, commentsRaw.map((comment) => comment.author_id));

  const commentIds = commentsRaw.map((comment) => comment.id);
  const [{ data: commentVotes }, { data: myCommentVotes }] = commentsRaw.length
    ? await Promise.all([
        supabase
          .from("forum_votes")
          .select("target_id, value")
          .eq("target_type", "comment")
          .in("target_id", commentIds),
        user
          ? supabase
              .from("forum_votes")
              .select("target_id, value")
              .eq("user_id", user.id)
              .eq("target_type", "comment")
              .in("target_id", commentIds)
          : Promise.resolve({ data: [] as Array<{ target_id: string; value: number }> }),
      ])
    : [{ data: [] as Array<{ target_id: string; value: number }> }, { data: [] as Array<{ target_id: string; value: number }> }];

  const commentScores = new Map<string, number>();
  for (const vote of commentVotes ?? []) {
    commentScores.set(vote.target_id, (commentScores.get(vote.target_id) ?? 0) + vote.value);
  }
  const myCommentVoteMap = new Map((myCommentVotes ?? []).map((vote) => [vote.target_id, vote.value]));

  const mapComment = (comment: Tables<"forum_comments">): ForumCommentItem => ({
    ...comment,
    score: commentScores.get(comment.id) ?? 0,
    current_user_vote: myCommentVoteMap.get(comment.id) ?? null,
    replies: [],
    ...authorDisplay(profiles.get(comment.author_id), comment.is_anonymous, profile?.role),
  });

  const topLevel = commentsRaw.filter((comment) => !comment.parent_comment_id).map(mapComment);
  const topLevelMap = new Map(topLevel.map((comment) => [comment.id, comment]));
  for (const replyRaw of commentsRaw.filter((comment) => comment.parent_comment_id)) {
    const parent = topLevelMap.get(replyRaw.parent_comment_id ?? "");
    if (parent) parent.replies.push(mapComment(replyRaw));
  }

  const { data: myVote } = user
    ? await supabase
        .from("forum_votes")
        .select("value")
        .eq("user_id", user.id)
        .eq("target_type", "post")
        .eq("target_id", post.id)
        .maybeSingle()
    : { data: null };

  const detail: ForumPostDetail = {
    ...summary,
    images,
    comments: topLevel,
    current_user_vote: myVote?.value ?? null,
  };

  return { forum: forum as Tables<"forums">, post: detail, role: profile?.role as ForumRole | undefined, userId: user?.id ?? null };
}

export async function getAdminForumsDashboard(): Promise<AdminForumsDashboard> {
  const supabase = await createClient();
  const { profile } = await getCurrentForumUser(supabase);
  if (profile?.role !== "admin") return { requests: [], forums: [], reports: [] };

  const adminClient = serviceClient() ?? supabase;
  const [requestsRes, forumsRes, reportsRes] = await Promise.all([
    adminClient
      .from("forum_creation_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    adminClient.from("forums").select("*").order("created_at", { ascending: false }),
    adminClient
      .from("forum_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const requestsRaw = (requestsRes.data ?? []) as ForumRequestItem[];
  const forums = await enrichForums(adminClient, (forumsRes.data ?? []) as Tables<"forums">[]);
  const reportsRaw = (reportsRes.data ?? []) as Tables<"forum_reports">[];

  const requestProfiles = await getProfiles(adminClient, requestsRaw.map((request) => request.requested_by));
  const requests = requestsRaw.map((request) => {
    const requester = requestProfiles.get(request.requested_by);
    return {
      ...request,
      requester_name: fullName(requester),
      requester_username: requester?.username ?? null,
    };
  });

  const postReportIds = reportsRaw.filter((report) => report.target_type === "post").map((report) => report.target_id);
  const commentReportIds = reportsRaw.filter((report) => report.target_type === "comment").map((report) => report.target_id);

  const [postsRes, commentsRes] = await Promise.all([
    postReportIds.length
      ? adminClient.from("forum_posts").select("*").in("id", postReportIds)
      : Promise.resolve({ data: [] }),
    commentReportIds.length
      ? adminClient.from("forum_comments").select("*").in("id", commentReportIds)
      : Promise.resolve({ data: [] }),
  ]);

  const posts = (postsRes.data ?? []) as Tables<"forum_posts">[];
  const comments = (commentsRes.data ?? []) as Tables<"forum_comments">[];
  const commentPostIds = comments.map((comment) => comment.post_id);
  const relatedPostIds = [...new Set([...posts.map((post) => post.id), ...commentPostIds])];
  const { data: relatedPostsData } = relatedPostIds.length
    ? await adminClient.from("forum_posts").select("id, forum_id, title, author_id, is_anonymous").in("id", relatedPostIds)
    : { data: [] as Array<Pick<Tables<"forum_posts">, "id" | "forum_id" | "title" | "author_id" | "is_anonymous">> };

  const relatedPosts = (relatedPostsData ?? []) as Pick<
    Tables<"forum_posts">,
    "id" | "forum_id" | "title" | "author_id" | "is_anonymous"
  >[];
  const forumMap = new Map(forums.map((forum) => [forum.id, forum]));
  const postMap = new Map([...posts, ...relatedPosts].map((post) => [post.id, post]));
  const commentMap = new Map(comments.map((comment) => [comment.id, comment]));

  const allAuthorIds = [
    ...posts.map((post) => post.author_id),
    ...comments.map((comment) => comment.author_id),
    ...reportsRaw.map((report) => report.reporter_id),
  ];
  const profiles = await getProfiles(adminClient, allAuthorIds);

  const reports = reportsRaw.map((report) => {
    const reporter = profiles.get(report.reporter_id);
    if (report.target_type === "post") {
      const post = postMap.get(report.target_id);
      const forum = post ? forumMap.get(post.forum_id) : null;
      const author = post ? profiles.get(post.author_id) : null;
      return {
        ...report,
        reporter_name: fullName(reporter),
        target_label: post?.title ?? "Deleted post",
        target_href: post && forum ? `/forums/${forum.slug}/posts/${post.id}` : null,
        target_author_name: fullName(author),
        target_author_id: post?.author_id ?? null,
        target_author_username: author?.username ?? null,
        target_is_anonymous: post?.is_anonymous ?? false,
        target_is_hidden: "is_hidden" in (post ?? {}) ? Boolean((post as Tables<"forum_posts"> | undefined)?.is_hidden) : false,
      };
    }

    const comment = commentMap.get(report.target_id);
    const post = comment ? postMap.get(comment.post_id) : null;
    const forum = post ? forumMap.get(post.forum_id) : null;
    const author = comment ? profiles.get(comment.author_id) : null;
    return {
      ...report,
      reporter_name: fullName(reporter),
      target_label: comment?.body.slice(0, 80) || "Deleted comment",
      target_href: post && forum ? `/forums/${forum.slug}/posts/${post.id}` : null,
      target_author_name: fullName(author),
      target_author_id: comment?.author_id ?? null,
      target_author_username: author?.username ?? null,
      target_is_anonymous: comment?.is_anonymous ?? false,
      target_is_hidden: comment?.is_hidden ?? false,
    };
  });

  return { requests, forums, reports };
}
