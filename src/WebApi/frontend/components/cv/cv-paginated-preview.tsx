"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import type { ResumeData } from "@/features/tao-cv/resume-data";

const A4_RATIO = 297 / 210;

/** Ngưỡng text chrome: khối không-item dài hơn mức này không được đu theo. */
const CHROME_TEXT_LIMIT = 200;

/** Khoảng thở bù trên trang tiếp nối — 5mm (~19px), đồng bộ với CSS
    .cv-sheet padding (paginate trừ bao nhiêu, CSS đắp bấy nhiêu). */
const CONTINUATION_TOP_PAD_MM = 5;

/** Trang chứa item i — gán theo tọa độ Y thực tế, độc lập cột trái/phải. */
type ItemPages = number[];

/** Một khối hiển thị: các node chrome (heading/banner/kẻ) + item con thuộc nó. */
interface SectionGroup {
  /** Phần tử bọc để ẩn/hiện cả khối (section shell hoặc wrapper). */
  owner: HTMLElement | null;
  /** Chrome đi kèm (heading trước khối, divider...) — ẩn/hiện cùng owner. */
  chrome: HTMLElement[];
  /** Half-open range vào mảng items đã đo. Rỗng = khối không có item. */
  items: [number, number];
}

interface CvPaginatedPreviewProps {
  resume: ResumeData;
  Component: ComponentType<{ data: ResumeData }>;
  templateKey: string;
  onPageCount?: (count: number) => void;
}

/**
 * Real A4 pagination around the Template Registry.
 *
 * Strategy: render the template once in a hidden, same-width measurement
 * pass, read each `.cv-section-item` top/height (templates already mark
 * unbreakable blocks via `SectionShell`), then greedily pack items into
 * A4-capacity pages. Each visible sheet renders the same template with
 * out-of-range items hidden — templates and ResumeData are untouched,
 * content is never truncated, and long CVs simply grow more sheets.
 */
export function CvPaginatedPreview({ resume, Component, templateKey, onPageCount }: CvPaginatedPreviewProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef<number>(1);
  const groupsRef = useRef<SectionGroup[]>([]);
  const oversizeRef = useRef<Set<number>>(new Set());
  const pageOfRef = useRef<ItemPages>([]);
  const [pages, setPages] = useState<number[] | null>(null);

  const paginate = useCallback(() => {
    const measure = measureRef.current;
    if (!measure) return;
    const paper = measure.firstElementChild as HTMLElement | null;
    if (!paper) return;

    const paperRect = paper.getBoundingClientRect();
    if (paperRect.width === 0) return;
    const capacity = paperRect.width * A4_RATIO;
    const items = Array.from(paper.querySelectorAll<HTMLElement>(".cv-section-item"));

    if (items.length === 0) {
      pageOfRef.current = [];
      setPages([0]);
      if (lastCountRef.current !== 1) {
        lastCountRef.current = 1;
        onPageCount?.(1);
      }
      return;
    }

    const tops = items.map((el) => el.getBoundingClientRect().top - paperRect.top);
    const bottoms = items.map((el, i) => tops[i] + el.getBoundingClientRect().height);
    const heights = items.map((el) => el.getBoundingClientRect().height);

    // BATCH-print-1: nhóm Section -> Items trên bản đo. Mỗi top-level child
    // chứa item là một owner; chrome (heading/banner/divider, không item)
    // nào cũng gắn xuôi vào owner CÓ ITEM KẾ TIẾP — để tiêu đề không bao giờ
    // ở lại một mình trên trang không còn dữ liệu của nó.
    const groups: SectionGroup[] = [];
    const itemOwner = new Map<HTMLElement, number>();
    items.forEach((el, i) => itemOwner.set(el, i));
    const topChildren = Array.from(paper.children).filter(
      (n): n is HTMLElement => n instanceof HTMLElement,
    );
    let pendingChrome: HTMLElement[] = [];
    const flushChromeTo = (g: SectionGroup | null) => {
      if (g) g.chrome.push(...pendingChrome);
      else if (pendingChrome.length > 0 && groups.length > 0) {
        // Chrome dôi cuối giấy (footer...) — gắn vào nhóm cuối.
        groups[groups.length - 1].chrome.push(...pendingChrome);
      }
      // Không nhóm nào cả (giấy không item): giữ hiện ở trang duy nhất,
      // xử lý ở apply (pages [0]).
      pendingChrome = [];
    };
    for (const child of topChildren) {
      if (child.tagName === "HEADER") continue; // header giấy: luật riêng.
      const owned = child.classList.contains("cv-section-item")
        ? [child]
        : Array.from(child.querySelectorAll<HTMLElement>(":scope .cv-section-item"));
      if (owned.length === 0) {
        // BATCH-noblank-task: chrome DÀI (khối text không gắn item-class mà
        // template bỏ sót) thành group độc lập chỉ hiện trang đầu — cấm đu
        // theo group sau. Chrome ngắn (heading/divider <200 ký tự) vẫn gắn xuôi.
        if ((child.textContent ?? "").trim().length >= CHROME_TEXT_LIMIT) {
          groups.push({ owner: child, chrome: [], items: [0, 0] });
        } else {
          pendingChrome.push(child);
        }
        continue;
      }
      const idx = owned
        .map((el) => itemOwner.get(el))
        .filter((v): v is number => v !== undefined)
        .sort((a, b) => a - b);
      const g: SectionGroup = {
        owner: child,
        chrome: [],
        items: [idx[0], idx[idx.length - 1] + 1],
      };
      flushChromeTo(g);
      groups.push(g);
    }
    // Chrome dôi mà không có nhóm nào: tạo nhóm rỗng để apply quyết định.
    if (pendingChrome.length > 0 && groups.length === 0) {
      groups.push({ owner: null, chrome: pendingChrome, items: [0, 0] });
      pendingChrome = [];
    } else {
      flushChromeTo(null);
    }
    groupsRef.current = groups;

    // BATCH-print-1: item cao hơn cả trang A4 không vừa đâu cả — đánh dấu
    // oversize để CSS cho tách nội bộ (thay vì bị cắt cụt chữ ở mép đáy).
    const oversize = new Set<number>();
    items.forEach((_, i) => {
      if (heights[i] > capacity) oversize.add(i);
    });
    oversizeRef.current = oversize;

    // Trang tiếp nối có padding-top bù (CSS .cv-sheet) nên sức chứa thực tế
    // giảm đúng bằng đó — trừ ra ở đây để item cuối không tràn khỏi sheet
    // (cả preview aspect-ratio lẫn print đều khớp, giữ WYSIWYG).
    const pxPerMm = paperRect.width / 210;
    const continuationPad = pxPerMm * CONTINUATION_TOP_PAD_MM;

    // B2-ĐÁY AN TOÀN (density pass): 28px (~7.4mm) — chỉ chống làm tròn
    // sub-pixel + chân chữ descender; paper vốn đã có padding đáy riêng.
    const BOTTOM_SAFETY_MARGIN_PX = 28;

    // Y-PARTITION (thay index-slice): mỗi item thuộc về trang K đầu tiên
    // chứa trọn đáy của nó trong biên dùng được cộng dồn. Biên trang K:
    // bound[K] -> bound[K] + usable(K), với usable(0)=A4-đệm đáy,
    // usable(K>0)=A4-đệm đáy-đệm bù đầu trang. Item gán theo tọa độ Y của
    // chính nó — cột trái/phải không ảnh hưởng. Guard i > pageStart chống
    // kẹt item khổng lồ (nó ở một mình một trang + cờ oversize).
    // Toán học tương đương greedy cũ trên luồng 1 cột nên template 1 cột
    // (minimal-ats) giữ nguyên số trang; khác biệt duy nhất: gán per-item
    // thay vì lát cắt index — đúng cho layout nhiều cột.
    const pageCapacity = (k: number): number =>
      capacity - (k === 0 ? 0 : continuationPad) - BOTTOM_SAFETY_MARGIN_PX;
    const pageOf: ItemPages = new Array(items.length).fill(0);
    let bound = 0;
    let K = 0;
    let pageStart = 0;
    for (let i = 0; i < items.length; i += 1) {
      while (bottoms[i] - bound > pageCapacity(K) && i > pageStart) {
        bound += pageCapacity(K);
        K += 1;
        pageStart = i;
      }
      pageOf[i] = K;
    }
    pageOfRef.current = pageOf;
    const pageCount = K + 1;

    setPages(Array.from({ length: pageCount }, (_, p) => p));
    if (lastCountRef.current !== pageCount) {
      lastCountRef.current = pageCount;
      onPageCount?.(pageCount);
    }
  }, [onPageCount]);

  useLayoutEffect(() => {
    paginate();
  }, [paginate, resume, templateKey]);

  useEffect(() => {
    let raf = 0;
    const schedule = () => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => paginate());
    };
    window.addEventListener("resize", schedule);
    document.fonts?.ready.then(() => paginate()).catch(() => undefined);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
    };
  }, [paginate]);

  // Apply the computed pages to the visible sheets:
  // - item ngoài range: ẩn; item oversize: gắn class cho tách nội bộ.
  // - BATCH-print-1: section (owner + chrome) không còn item nào thuộc trang:
  //   ẩn cả khối để tiêu đề rỗng không lặp ở trang 2+. Section có item chảy
  //   qua nhiều trang: đánh dấu data-continued ở các sheet tiếp nối.
  // - header giấy: chỉ hiện ở trang đầu (luật cũ giữ nguyên).
  useLayoutEffect(() => {
    const host = pagesRef.current;
    if (!host || !pages) return;
    const groups = groupsRef.current;
    const oversize = oversizeRef.current;
    const pageOf = pageOfRef.current;
    // Trang đầu tiên mỗi group xuất hiện (để đánh dấu tiếp nối các trang sau).
    const groupFirstPage = new Map<SectionGroup, number>();
    for (const g of groups) {
      const [gs, ge] = g.items;
      let first = Number.MAX_SAFE_INTEGER;
      for (let i = gs; i < ge; i += 1) {
        const p = pageOf[i];
        if (p !== undefined && p < first) first = p;
      }
      if (first !== Number.MAX_SAFE_INTEGER) groupFirstPage.set(g, first);
    }
    Array.from(host.children).forEach((sheet, page) => {
      const paper = sheet.firstElementChild as HTMLElement | null;
      if (!paper) return;
      // B1-RESET DỨT ĐIỂM: React giữ nguyên DOM node + inline style giữa các
      // lần gõ/preview; khi số lượng/thứ tự item đổi, index cũ trùm nhầm sang
      // node mới (heading hiện dù item đã đi trang khác). Xóa sạch mọi dấu
      // vết apply lần trước TRƯỚC khi tính lại — mọi nhánh dưới đây đều set
      // tường minh nên không có trạng thái treo.
      paper
        .querySelectorAll<HTMLElement>(".cv-section-item")
        .forEach((el) => {
          el.style.display = "";
          el.classList.remove("cv-section-item--oversize");
        });
      paper
        .querySelectorAll<HTMLElement>("section[data-continued]")
        .forEach((el) => {
          el.removeAttribute("data-continued");
        });
      Array.from(paper.children).forEach((n) => {
        if (n instanceof HTMLElement) n.style.display = "";
      });
      const sheetItems = Array.from(
        paper.querySelectorAll<HTMLElement>(".cv-section-item"),
      );
      sheetItems.forEach((el, i) => {
        // Y-PARTITION: item hiện ⟺ trang Y của nó đúng trang sheet này —
        // không phụ thuộc cột trái/phải hay lát cắt index.
        el.style.display = pageOf[i] === page ? "" : "none";
        el.classList.toggle("cv-section-item--oversize", oversize.has(i));
      });
      // Ánh xạ owner/chrome của bản đo sang sheet hiện tại theo thứ tự DOM:
      // thứ tự top-level children và items đồng nhất giữa các bản render.
      const sheetKids = Array.from(paper.children).filter(
        (n): n is HTMLElement => n instanceof HTMLElement,
      );
      let itemCursor = 0;
      const sheetGroups: { owner: HTMLElement | null; chrome: HTMLElement[]; items: [number, number] }[] = [];
      for (const child of sheetKids) {
        if (child.tagName === "HEADER") continue;
        const count = child.classList.contains("cv-section-item")
          ? 1
          : child.querySelectorAll(".cv-section-item").length;
        if (count === 0) {
          // Chrome: gom chờ gắn vào nhóm có item kế tiếp (giống bản đo) —
          // trừ khối text dài (không-item mà template bỏ sót): group độc lập
          // chỉ hiện trang đầu, mirror đúng luật phía measure (pending giữ
          // nguyên cho owner kế tiếp — sai lệch là vỡ mapping theo index).
          if ((child.textContent ?? "").trim().length >= CHROME_TEXT_LIMIT) {
            sheetGroups.push({ owner: child, chrome: [], items: [0, 0] });
          } else {
            (sheetGroups as unknown as { pending?: HTMLElement[] }).pending ??= [];
            ((sheetGroups as unknown as { pending?: HTMLElement[] }).pending as HTMLElement[]).push(child);
          }
          continue;
        }
        const pend = (sheetGroups as unknown as { pending?: HTMLElement[] }).pending ?? [];
        (sheetGroups as unknown as { pending?: HTMLElement[] }).pending = [];
        sheetGroups.push({
          owner: child,
          chrome: pend,
          items: [itemCursor, itemCursor + count],
        });
        itemCursor += count;
      }
      const tailPend = (sheetGroups as unknown as { pending?: HTMLElement[] }).pending ?? [];
      if (tailPend.length > 0 && sheetGroups.length > 0) {
        sheetGroups[sheetGroups.length - 1].chrome.push(...tailPend);
      } else if (tailPend.length > 0) {
        sheetGroups.push({ owner: null, chrome: tailPend, items: [0, 0] });
      }
      sheetGroups.forEach((g, gi) => {
        const ref = groups[gi];
        const [gs, ge] = g.items;
        // Section hiện ⟺ có ≥1 item con thuộc trang này (theo tọa độ Y).
        let visible = false;
        for (let i = gs; i < ge; i += 1) {
          if (pageOf[i] === page) {
            visible = true;
            break;
          }
        }
        const show = visible || (gs === ge && page === 0);
        const disp = show ? "" : "none";
        if (g.owner) {
          g.owner.style.display = disp;
          // Tiếp nối: group bắt đầu từ trang trước và còn item ở trang này.
          const first = ref ? groupFirstPage.get(ref) : undefined;
          if (g.owner.tagName === "SECTION") {
            if (show && first !== undefined && page > first) {
              g.owner.setAttribute("data-continued", "true");
            } else {
              g.owner.removeAttribute("data-continued");
            }
          }
        }
        g.chrome.forEach((c) => {
          c.style.display = disp;
        });
      });
      const header = paper.querySelector<HTMLElement>("header");
      if (header) header.style.display = page === 0 ? "" : "none";

      // B1-quét vét (độc lập với mapping nhóm theo index): mọi section shell
      // không còn item HIỂN THỊ nào đều bị ẩn — heading rỗng không có cửa
      // sống sót dù mapping nhóm có lệch. Shell vốn không item nào thì chỉ
      // được hiện ở trang đầu (nội dung trang trí thuộc về trang mở đầu).
      paper
        .querySelectorAll<HTMLElement>("section.cv-section-shell")
        .forEach((sec) => {
          const itemsHere = Array.from(
            sec.querySelectorAll<HTMLElement>(".cv-section-item"),
          );
          const anyShown = itemsHere.some(
            (el) =>
              el.style.display !== "none" && el.getClientRects().length > 0,
          );
          if (!anyShown) {
            if (itemsHere.length === 0) {
              if (page > 0) sec.style.display = "none";
            } else {
              sec.style.display = "none";
            }
          }
        });

      // BATCH-blank: sheet không còn node hiển thị nào (mọi item/group đều
      // bị ẩn, header cũng ẩn) thì ẩn cả sheet — không để khung A4 rỗng,
      // print cũng không đẻ trang trắng từ break-after của nó. Kiểm tra bằng
      // rects thực (display:none không có rect; leaf text cũng có rect).
      const nodeAlive = (el: HTMLElement | null): boolean =>
        el !== null && el.style.display !== "none" && el.getClientRects().length > 0;
      const sheetAlive =
        nodeAlive(header) ||
        sheetGroups.some(
          (g) => nodeAlive(g.owner) || g.chrome.some((c) => nodeAlive(c)),
        );
      (sheet as HTMLElement).style.display = sheetAlive ? "" : "none";
    });
  }, [pages, resume, templateKey]);

  const visible: number[] = pages ?? [0];

  return (
    <div className="cv-pages-root" data-cv-document>
      <div ref={pagesRef} className="cv-pages cv-preview-crossfade" key={templateKey}>
        {visible.map((_, page) => (
          <div key={`${templateKey}-p${page}`} className="cv-sheet" data-page={page + 1}>
            <Component data={resume} />
          </div>
        ))}
      </div>
      <div ref={measureRef} className="cv-measure" aria-hidden="true">
        <Component data={resume} />
      </div>
    </div>
  );
}
