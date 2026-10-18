const DEFAULT_REPOSITORY_URL = 'https://github.com/nunule/tools_local';
const configuredUrl = import.meta.env.VITE_GITHUB_URL?.trim().replace(/\/+$/, '');

// Keep the repository, Releases page and public download API on the same project.
export const GITHUB_URL = configuredUrl && /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(configuredUrl)
  ? configuredUrl.replace(/\.git$/, '')
  : DEFAULT_REPOSITORY_URL;
export const GITHUB_RELEASES_URL = `${GITHUB_URL}/releases`;
export const GITHUB_RELEASE_API_URL = `https://api.github.com/repos/${GITHUB_URL.split('github.com/')[1]}/releases/latest`;
