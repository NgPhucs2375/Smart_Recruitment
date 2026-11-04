/**
 * DOCX mà người dùng nộp ở Việt Nam phần lớn là CV dạng bảng (mẫu TopCV, ITviec):
 * ô trái là nhãn "Kinh nghiệm làm việc", ô phải là nội dung. mammoth.extractRawText
 * rải mỗi ô thành một dòng rời, nên mô hình không còn biết nhãn nào đi với giá trị nào.
 * Hàm này đọc HTML do mammoth.convertToHtml sinh ra và trả về một dòng cho mỗi hàng
 * bảng, các ô nối nhau bằng " | ", giữ nguyên thứ tự tài liệu.
 *
 * Chỉ dùng chuỗi thuần (không DOM, không dependency) để chạy được cả trong trình
 * duyệt lẫn trong node khi test.
 */

type Frame =
  | { kind: "block"; text: string }
  | { kind: "cell"; text: string }
  | { kind: "row"; cells: string[] }
  | { kind: "table" };

const BLOCK_TAGS = new Set([
  "p",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "ul",
  "ol",
  "pre",
  "blockquote",
  "section",
  "article",
]);

// mammoth chèn <img> (ảnh đại diện) và <br> ngay trong chữ. Thẻ rỗng không có tag
// đóng; coi nó là khối sẽ dồn đoạn text phía sau sang dòng khác và phá thứ tự
// "nhãn | giá trị" của hàng bảng.
const VOID_TAGS = new Set(["img", "hr", "input", "br", "col", "embed", "source", "track", "wbr"]);

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function flattenDocxHtml(html: string): string {
  const lines: string[] = [];
  const stack: Frame[] = [];
  let pending = "";

  const textFrame = () => {
    for (let i = stack.length - 1; i >= 0; i -= 1) {
      const frame = stack[i];
      if (frame.kind === "block" || frame.kind === "cell") return frame;
    }
    return null;
  };
  const nearestKind = (kind: Frame["kind"]) => {
    for (let i = stack.length - 1; i >= 0; i -= 1) if (stack[i].kind === kind) return i;
    return -1;
  };
  const addLine = (line: string) => {
    const value = line.trim();
    if (!value) return;
    flushPending();
    lines.push(value.replace(/\s+/g, " "));
  };
  const flushPending = () => {
    const value = pending.trim();
    pending = "";
    if (value) addLine(value);
  };
  const appendText = (value: string) => {
    const frame = textFrame();
    if (frame) frame.text += value;
    else pending += value;
  };

  let cursor = 0;
  while (cursor < html.length) {
    const open = html.indexOf("<", cursor);
    if (open < 0) {
      appendText(decodeEntities(html.slice(cursor)));
      break;
    }
    if (open > cursor) appendText(decodeEntities(html.slice(cursor, open)));
    if (html.startsWith("<!--", open)) {
      cursor = (html.indexOf("-->", open) + 3) || html.length;
      continue;
    }
    if (html.startsWith("<!", open) || html.startsWith("<?", open)) {
      cursor = (html.indexOf(">", open) + 1) || html.length;
      continue;
    }
    const close = html.indexOf(">", open);
    if (close < 0) {
      appendText(decodeEntities(html.slice(open)));
      break;
    }
    let raw = html.slice(open + 1, close);
    cursor = close + 1;
    if (raw.endsWith("/")) raw = raw.slice(0, -1);
    const isClosing = raw.startsWith("/");
    const space = raw.search(/\s/);
    const tag = (space < 0 ? raw : raw.slice(0, space)).slice(isClosing ? 1 : 0).toLowerCase();
    if (!tag) continue;

    if (isClosing) {
      popTo(tag);
      continue;
    }
    if (VOID_TAGS.has(tag)) {
      if (tag === "br") appendText(" ");
      continue;
    }
    if (tag === "table" || tag === "tr" || tag === "td" || tag === "th" || BLOCK_TAGS.has(tag)) {
      flushPending();
      if (tag === "table") stack.push({ kind: "table" });
      else if (tag === "tr") stack.push({ kind: "row", cells: [] });
      else if (tag === "td" || tag === "th") stack.push({ kind: "cell", text: "" });
      else stack.push({ kind: "block", text: "" });
    }
  }
  while (stack.length > 0) popTo(tagOf(stack[stack.length - 1]));
  flushPending();
  return lines.join("\n");

  function popTo(tag: string) {
    const frameKind =
      tag === "table" ? "table" : tag === "tr" ? "row" : tag === "td" || tag === "th" ? "cell" : BLOCK_TAGS.has(tag) ? "block" : null;
    if (frameKind === null) return;
    const index = nearestKind(frameKind as Frame["kind"]);
    if (index < 0) return;
    while (stack.length - 1 > index) popFrame(stack.length - 1);
    popFrame(index);
  }

  function popFrame(index: number) {
    const frame = stack[index];
    stack.splice(index, 1);
    if (frame.kind === "block") {
      const value = frame.text.trim();
      if (!value) return;
      const cellIndex = nearestKind("cell");
      if (cellIndex >= 0) {
        const cell = stack[cellIndex] as { kind: "cell"; text: string };
        cell.text += cell.text.trim() ? `; ${value}` : value;
      } else addLine(value);
      return;
    }
    if (frame.kind === "cell") {
      const rowIndex = nearestKind("row");
      if (rowIndex >= 0) (stack[rowIndex] as { kind: "row"; cells: string[] }).cells.push(frame.text.trim());
      else addLine(frame.text);
      return;
    }
    if (frame.kind === "row") {
      const outerCell = nearestKind("cell");
      const rowText = frame.cells.filter((cell) => cell.length > 0).join(" | ");
      if (outerCell >= 0 && nearestKind("table") >= 0) {
        const cell = stack[outerCell] as { kind: "cell"; text: string };
        cell.text += cell.text.trim() ? `; ${rowText}` : rowText;
      } else if (rowText) addLine(rowText);
      return;
    }
  }
}

function tagOf(frame: Frame): string {
  if (frame.kind === "table") return "table";
  if (frame.kind === "row") return "tr";
  if (frame.kind === "cell") return "td";
  return "p";
}

function decodeEntities(value: string): string {
  return value.replace(/&(#\d+|#[xX][0-9a-fA-F]+|[a-zA-Z]+);/g, (match, name: string) => {
    if (name.startsWith("#x") || name.startsWith("#X")) {
      const code = Number.parseInt(name.slice(2), 16);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    if (name.startsWith("#")) {
      const code = Number.parseInt(name.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    return ENTITIES[name.toLowerCase()] ?? match;
  });
}
