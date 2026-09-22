import {
  fileBasename,
  formatFilePathPosition,
  inlineCodeFilePathCandidate,
  isRelativeFilePath,
  normalizeMarkdownLinkDestination,
  parseFileUrlHref,
  parseMarkdownFileLink,
  remapPathIntoWorkspaceRoot,
  safeDecodeURIComponent,
  splitFilePathPosition,
  workspaceRelativePathOrRoot,
} from "@t3tools/client-runtime/markdown-links";

import { formatWorkspaceRelativePath } from "./filePathDisplay";
import { isAbsolutePath, isTerminalLinkActivation, resolvePathLinkTarget } from "./terminal-links";

export { normalizeMarkdownLinkDestination };

const MARKDOWN_LINK_HREF_PATTERN =
  /\[[^\]]*]\(\s*(?:<([^>\n]+)>|([^\s)]+))(?:\s+["'][^"']*["'])?\s*\)/g;

export interface MarkdownFileLinkMeta {
  filePath: string;
  targetPath: string;
  displayPath: string;
  workspaceRelativePath: string | null;
  basename: string;
  line?: number;
  column?: number;
}

export function extractMarkdownLinkHrefs(markdown: string): string[] {
  const hrefs: string[] = [];
  for (const match of markdown.matchAll(MARKDOWN_LINK_HREF_PATTERN)) {
    const href = (match[1] ?? match[2])?.trim();
    if (href) hrefs.push(href);
  }
  return hrefs;
}

export function shouldOpenMarkdownFileLinkInEditor(
  event: Pick<MouseEvent, "metaKey" | "ctrlKey">,
  platform?: string,
): boolean {
  return isTerminalLinkActivation(event, platform);
}

export function shouldOpenMarkdownFileLinkInBrowserByDefault(path: string): boolean {
  return /\.pdf$/i.test(path.split(/[?#]/, 1)[0] ?? "");
}

export function isWindowsDrivePathHref(href: string): boolean {
  return /^[A-Za-z]:[\\/]/.test(safeDecodeURIComponent(href));
}

export function rewriteMarkdownFileUriHref(href: string | undefined): string | null {
  if (!href) return null;
  const target = parseFileUrlHref(normalizeMarkdownLinkDestination(href));
  return target ? `${target.path}${target.hash}` : null;
}

/**
 * `baseDir` anchors relative links; it defaults to the workspace root and is the
 * file's own directory when rendering a markdown file. `cwd` stays the workspace
 * root so the result still knows whether the target is inside it.
 */
export function resolveMarkdownFileLinkTarget(
  href: string | undefined,
  cwd?: string,
  baseDir: string | undefined = cwd,
): string | null {
  if (!href) return null;
  const target = parseMarkdownFileLink(href);
  if (!target) return null;

  const pathWithPosition = formatFilePathPosition(target);
  if (!isRelativeFilePath(pathWithPosition)) return pathWithPosition;
  if (!baseDir) return null;
  return resolvePathLinkTarget(pathWithPosition, baseDir);
}

/**
 * Inline code spans mostly hold identifiers, commands, and refs (`node.meta`,
 * `origin/main`) rather than deliberate link destinations, so auto-linking
 * them demands stronger path evidence than an explicit markdown link does:
 * an unambiguous path prefix, a file extension, or a :line suffix.
 */
export function resolveInlineCodeFileLinkMeta(
  codeText: string,
  cwd?: string,
  baseDir: string | undefined = cwd,
  projectWorkspaceRoot?: string,
): MarkdownFileLinkMeta | null {
  const candidate = inlineCodeFilePathCandidate(codeText);
  if (candidate === null) return null;

  return resolveMarkdownFileLinkMeta(candidate, cwd, baseDir, projectWorkspaceRoot);
}

export function resolveMarkdownFileLinkMeta(
  href: string | undefined,
  cwd?: string,
  baseDir: string | undefined = cwd,
  projectWorkspaceRoot?: string,
): MarkdownFileLinkMeta | null {
  const targetPath = resolveMarkdownFileLinkTarget(href, cwd, baseDir);
  if (!targetPath) return null;
  return buildFileLinkMetaFromTarget(targetPath, cwd, projectWorkspaceRoot);
}

/**
 * Files panel path for a resolved link: workspace-relative (including `""` for
 * the root directory), an absolute host path outside the workspace, or null.
 */
export function markdownFilePanelPath(
  fileLinkMeta: Pick<MarkdownFileLinkMeta, "filePath" | "workspaceRelativePath">,
  options?: { canPreviewMedia?: boolean },
): string | null {
  if (fileLinkMeta.workspaceRelativePath !== null) {
    return fileLinkMeta.workspaceRelativePath;
  }
  if (options?.canPreviewMedia) return null;
  return isAbsolutePath(fileLinkMeta.filePath) ? fileLinkMeta.filePath : null;
}

function buildFileLinkMetaFromTarget(
  targetPath: string,
  cwd?: string,
  projectWorkspaceRoot?: string,
): MarkdownFileLinkMeta {
  const { path, line, column } = splitFilePathPosition(targetPath);
  const remappedPath =
    cwd && projectWorkspaceRoot
      ? remapPathIntoWorkspaceRoot({
          path,
          workspaceRoot: cwd,
          sourceRoot: projectWorkspaceRoot,
        })
      : path;
  const remappedTargetPath =
    remappedPath === path
      ? targetPath
      : formatFilePathPosition({
          path: remappedPath,
          ...(line !== undefined ? { line } : {}),
          ...(column !== undefined ? { column } : {}),
        });

  return {
    filePath: remappedPath,
    targetPath: remappedTargetPath,
    displayPath: formatWorkspaceRelativePath(remappedTargetPath, cwd),
    workspaceRelativePath: workspaceRelativePathOrRoot(remappedPath, cwd),
    basename: fileBasename(remappedPath),
    ...(line !== undefined ? { line } : {}),
    ...(column !== undefined ? { column } : {}),
  };
}
