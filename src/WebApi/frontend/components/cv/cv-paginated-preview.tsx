"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import type { ResumeData } from "@/features/tao-cv/resume-data";

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
    let startTop = tops[0] ?? 0;
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
    document.fonts?.ready.then(() => paginate()).catch(() => undefined);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
    };
  }, [paginate]);

  // Apply the computed ranges to the visible sheets: hide out-of-range
  // items and the repeated header on continuation sheets.
  useLayoutEffect(() => {
    const host = pagesRef.current;
    if (!host || !ranges) return;
    Array.from(host.children).forEach((sheet, page) => {
      const range = ranges[page];
      if (!range) return;
      const [start, end] = range;
      const paper = sheet.firstElementChild as HTMLElement | null;
      if (!paper) return;
      paper.querySelectorAll<HTMLElement>(".cv-section-item").forEach((el, i) => {
        el.style.display = i >= start && i < end ? "" : "none";
      });
      const header = paper.querySelector<HTMLElement>("header");
      if (header) header.style.display = page === 0 ? "" : "none";
    });
  }, [ranges, resume, templateKey]);

  const visible: PageRange[] = ranges ?? [[0, Number.MAX_SAFE_INTEGER]];

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
