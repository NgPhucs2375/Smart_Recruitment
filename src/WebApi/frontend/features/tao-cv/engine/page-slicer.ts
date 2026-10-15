/**
 * Pure A4 Y-partition (không chạm DOM — test được bằng node thuần).
 *
 * Input: hình chữ nhật đã đo của từng `.cv-section-item`, theo đơn vị tỉ lệ
 * giấy (đã chia cho chiều rộng tờ A4 nên bất biến zoom). Output: trang của
 * từng item + tổng số trang + index các item oversize (cao hơn cả trang).
 *
 * Mỗi item thuộc về trang K đầu tiên chứa trọn đáy của nó trong biên dùng
 * được cộng dồn. Gán theo tọa độ Y thực tế nên đúng cho cả layout 1 cột lẫn
 * 2 cột (Main/Sidebar đo độc lập theo Y riêng của từng item — cột nào hết
 * trước thì trang sau cột đó trống, cột còn lại tự co giãn theo flow).
 * Guard `position > pageStart` chống kẹt item khổng lồ (ở một mình + oversize).
 */
export interface SliceItemRect {
  top: number;
  bottom: number;
  height: number;
}

export interface SliceOptions {
  /** Sức chứa 1 trang đầy (đơn vị tỉ lệ giấy, vd 297/210). */
  capacity: number;
  /** Đệm bù đầu trang tiếp nối (padding-top CSS của sheet sau). */
  continuationPad: number;
  /** Đệm an toàn đáy (làm tròn sub-pixel + chân chữ). */
  bottomSafety: number;
}

export interface SliceResult {
  /** pageOf[i] = trang của item i. */
  pageOf: number[];
  pageCount: number;
  /** Index các item cao hơn cả trang (CSS tách nội bộ, không cụt chữ). */
  oversize: number[];
}

export function slicePages(items: SliceItemRect[], opts: SliceOptions): SliceResult {
  const { capacity, continuationPad, bottomSafety } = opts;
  const pageCapacity = (k: number): number =>
    capacity - (k === 0 ? 0 : continuationPad) - bottomSafety;

  const oversize: number[] = [];
  items.forEach((it, i) => {
    if (it.height > capacity) oversize.push(i);
  });

  const pageOf: number[] = new Array(items.length).fill(0);
  let bound = 0;
  let k = 0;
  let pageStart = 0;
  // DOM order duyệt cột này xong mới sang cột khác — pack theo Y trực quan.
  const visualOrder = items.map((_, i) => i).sort((a, b) => items[a].top - items[b].top);
  for (let position = 0; position < visualOrder.length; position += 1) {
    const i = visualOrder[position];
    while (items[i].bottom - bound > pageCapacity(k) && position > pageStart) {
      bound += pageCapacity(k);
      k += 1;
      pageStart = position;
    }
    pageOf[i] = k;
  }
  return { pageOf, pageCount: k + 1, oversize };
}
