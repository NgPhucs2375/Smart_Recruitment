"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import type { ResumeData } from "@/features/tao-cv/resume-data";
import { focusCvSectionsInDom, getCvFocusEventName, type CvFocusSection } from "@/features/ai-cv/cv-focus";

const A4_RATIO = 297 / 210;

/** Half-open item index range [start, end) rendered on one sheet. */
type PageRange = [number, number];

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
  const [ranges, setRanges] = useState<PageRange[] | null>(null);

  useEffect(() => {
    const onFocus = (event: Event) => {
      const sections = (event as CustomEvent<{ sections?: unknown }>).detail?.sections;
      if (Array.isArray(sections)) {
        focusCvSectionsInDom(sections.filter((section): section is CvFocusSection => typeof section === "string"));
      }
    };

    window.addEventListener(getCvFocusEventName(), onFocus);
    return () => window.removeEventListener(getCvFocusEventName(), onFocus);
  }, []);

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
      setRanges([[0, 0]]);
      if (lastCountRef.current !== 1) {
        lastCountRef.current = 1;
        onPageCount?.(1);
      }
      return;
    }

    const tops = items.map((el) => el.getBoundingClientRect().top - paperRect.top);
    const bottoms = items.map((el, i) => tops[i] + el.getBoundingClientRect().height);

    const pages: PageRange[] = [];
    let start = 0;
    // Page one includes the template header and top padding, so measure from
    // the actual top of the paper. Subtracting the first item's top gave page
    // one extra space and allowed long content to run below the A4 boundary.
    let startTop = 0;
    for (let i = 0; i < items.length; i += 1) {
      // Continuation sheets hide the repeated header, so they gain a little
      // room; first-page capacity stays strict so page 1 never overflows.
      if (bottoms[i] - startTop > capacity && i > start) {
        pages.push([start, i]);
        start = i;
        startTop = tops[i];
      }
    }
    pages.push([start, items.length]);

    setRanges(pages);
    if (lastCountRef.current !== pages.length) {
      lastCountRef.current = pages.length;
      onPageCount?.(pages.length);
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
    const observer = new ResizeObserver(schedule);
    const measuredPaper = measureRef.current?.firstElementChild;
    if (measuredPaper) observer.observe(measuredPaper);
    document.fonts?.ready.then(() => paginate()).catch(() => undefined);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, [paginate]);

  // The template is expensive and the visible pages are display-only. Clone
  // the measured DOM instead of mounting the React template once per page.
  // This keeps one React render for the whole document, even for long CVs.
  useLayoutEffect(() => {
    const host = pagesRef.current;
    if (!host || !ranges) return;
    const measuredPaper = measureRef.current?.firstElementChild as HTMLElement | null;
    if (!measuredPaper) return;

    host.replaceChildren();
    ranges.forEach(([start, end], page) => {
      const sheet = document.createElement("div");
      sheet.className = "cv-sheet";
      sheet.dataset.page = String(page + 1);

      const paper = measuredPaper.cloneNode(true) as HTMLElement;
      paper.querySelectorAll<HTMLElement>(".cv-section-item").forEach((el, i) => {
        el.style.display = i >= start && i < end ? "" : "none";
      });
      const header = paper.querySelector<HTMLElement>("header");
      if (header) header.style.display = page === 0 ? "" : "none";

      sheet.appendChild(paper);
      host.appendChild(sheet);
    });
  }, [ranges, resume, templateKey]);

  return (
    <div className="cv-pages-root" data-cv-document data-cv-surface="preview">
      <div ref={pagesRef} className="cv-pages cv-preview-crossfade" />
      <div ref={measureRef} className="cv-measure" aria-hidden="true">
        <Component data={resume} />
      </div>
    </div>
  );
}
