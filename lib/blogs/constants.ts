export const DEFAULT_BLOG_IMAGE = "/images/blog-default.svg";

export function getBlogImageSrc(imageUrl: string | null) {
  return imageUrl?.trim() ? imageUrl : DEFAULT_BLOG_IMAGE;
}
