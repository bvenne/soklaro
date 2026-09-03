const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const projectLinks = {
  site: trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  repository: process.env.NEXT_PUBLIC_REPOSITORY_URL
    ? trimTrailingSlash(process.env.NEXT_PUBLIC_REPOSITORY_URL)
    : null,
};
