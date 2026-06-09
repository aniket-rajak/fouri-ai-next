const DANGEROUS_TAGS = new Set(["script", "foreignObject", "foreignobject"]);
const DANGEROUS_ATTRS = /^on/i;
const DANGEROUS_URI = /^\s*javascript\s*:/i;

export function sanitizeSvg(svgString: string): string {
  if (typeof document === "undefined" || !svgString) return "";

  let content = svgString.trim();
  if (!content.startsWith("<svg") && !content.startsWith("<SVG")) {
    const match = content.match(/<svg[\s\S]*?<\/svg>/i);
    if (!match) return "";
    content = match[0];
  }

  let doc: Document;
  try {
    if (content.startsWith("<svg") || content.startsWith("<SVG")) {
      doc = new DOMParser().parseFromString(content, "image/svg+xml");
    } else {
      doc = new DOMParser().parseFromString(
        `<svg xmlns="http://www.w3.org/2000/svg">${content}</svg>`,
        "image/svg+xml"
      );
    }
    const parserError = doc.querySelector("parsererror");
    if (parserError) return "";
  } catch {
    return "";
  }

  const svgEl = doc.documentElement;

  if (svgEl.tagName !== "svg" && svgEl.tagName !== "SVG") return "";

  walkAndClean(svgEl);

  const cleaned = new XMLSerializer().serializeToString(svgEl);

  return cleaned;
}

function walkAndClean(el: Element): void {
  // Remove dangerous tags
  if (DANGEROUS_TAGS.has(el.tagName)) {
    el.remove();
    return;
  }

  // Remove dangerous attributes
  const attrsToRemove: Attr[] = [];
  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes[i];
    if (DANGEROUS_ATTRS.test(attr.name)) {
      attrsToRemove.push(attr);
    } else if (DANGEROUS_URI.test(attr.value)) {
      attrsToRemove.push(attr);
    }
  }
  for (const attr of attrsToRemove) {
    el.removeAttributeNode(attr);
  }

  // Recurse children
  for (let i = el.children.length - 1; i >= 0; i--) {
    walkAndClean(el.children[i]);
  }
}
