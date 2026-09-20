import { translateText, type Language } from './index';

/** Update authored text in place: preserve inputs, focus, listeners and live game DOM. */
export function translateInterface(root: HTMLElement, from: Language): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.parentElement?.closest('[data-user-content], script, style, input, textarea')) continue;
    if (node.textContent?.trim()) node.textContent = translateText(node.textContent, from);
  }
  for (const element of root.querySelectorAll('[aria-label], [placeholder], [title]')) {
    if (element.closest('[data-user-content]')) continue;
    for (const attribute of ['aria-label', 'placeholder', 'title']) {
      const value = element.getAttribute(attribute);
      if (value) element.setAttribute(attribute, translateText(value, from));
    }
  }
}
