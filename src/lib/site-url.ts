import { site } from "../data/site";

export function siteOrigin(): string {
  return site.metadata.origin.replace(/\/+$/, "");
}

export function absoluteUrl(pathname: string): string {
  if (/^https?:\/\//i.test(pathname)) {
    return pathname;
  }

  const origin = siteOrigin();
  if (pathname === "" || pathname === "/") {
    return `${origin}/`;
  }

  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${origin}${path}`;
}

export function defaultOgImageUrl(): string {
  return absoluteUrl(site.metadata.ogImage);
}
