import assert from 'node:assert/strict';
import test from 'node:test';

const baseUrl = (process.env.CV_RENDER_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/+$/, '');
const candidateName = 'NGUYỄN VĂN KIỂM THỬ POST';
const descriptionMarker = 'DỮ LIỆU CV DÀI KHÔNG ĐƯỢC ĐẶT TRONG URL';

function longCvData() {
  return {
    thongTinLienHe: {
      hoTen: candidateName,
      email: 'post-regression@example.com',
      sdt: '0901234567',
      diaChi: 'Hà Nội',
      github: '',
      linkedIn: '',
      portfolio: '',
      gioiTinh: 'Nam',
      ngaySinh: '',
      viTriUngTuyen: 'Lập trình viên',
      mucLuongMongMuon: '',
      gioiThieuBanThan: `${descriptionMarker}. ${'Phát triển phần mềm và xử lý dữ liệu tiếng Việt. '.repeat(240)}`,
      anhDaiDienUrl: '',
    },
    hocVan: [],
    kinhNghiemLamViec: [
      {
        id: 'exp-post-regression',
        congTy: 'Công ty kiểm thử',
        chucDanh: 'Lập trình viên',
        diaChi: 'Hà Nội',
        tuNgay: '01/2024',
        denNgay: '',
        isHienTai: true,
        moTa: `${descriptionMarker}. ${'Triển khai API, kiểm thử hồi quy và bảo vệ dữ liệu người dùng. '.repeat(160)}`,
        kyNangSuDung: ['TypeScript', 'React', 'PostgreSQL'],
      },
    ],
    duAn: [],
    kyNang: [],
    chungChi: [],
    templateId: 'tech-modern',
    tenFile: 'CV kiểm thử POST',
  };
}

test('POST renders a CV whose legacy URL exceeds 8192 bytes', async () => {
  const data = longCvData();
  const legacyUrl = `${baseUrl}/cv-render?d=${encodeURIComponent(JSON.stringify(data))}&t=tech-modern`;
  assert.ok(new TextEncoder().encode(legacyUrl).length > 8192, 'fixture must exceed the Nginx request-line limit');

  const response = await fetch(`${baseUrl}/api/cv-render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, templateId: 'tech-modern' }),
  });
  const html = await response.text();

  assert.equal(response.status, 200, html.slice(0, 500));
  assert.match(response.headers.get('content-type') ?? '', /text\/html/i);
  assert.ok(html.includes('data-cv-document'), html.slice(0, 500));
  assert.ok(html.includes(candidateName), 'rendered HTML must contain the candidate name');
  assert.ok(html.includes(descriptionMarker), 'rendered HTML must contain the long CV content');
  assert.match(html, /<link[^>]+rel=["']stylesheet["']/i);
  assert.doesNotMatch(html, /<script\b/i, 'WebView HTML must not depend on Next.js runtime scripts');
  assert.doesNotMatch(html, /id=["']S:\d+["']/i, 'WebView HTML must not hide streamed content');
  assert.match(html, /<body[^>]*>\s*<div class="cv-render-page\b/i, 'CV markup must be immediately visible in the body');
});

test('GET /cv-render still renders a short CV payload', async () => {
  const data = longCvData();
  data.thongTinLienHe.hoTen = 'ỨNG VIÊN GET';
  data.thongTinLienHe.gioiThieuBanThan = 'Bản render GET ngắn vẫn hoạt động.';
  data.kinhNghiemLamViec = [];
  const query = new URLSearchParams({ d: JSON.stringify(data), t: 'minimal-ats' });
  const response = await fetch(`${baseUrl}/cv-render?${query}`);
  const html = await response.text();

  assert.equal(response.status, 200, html.slice(0, 500));
  assert.ok(html.includes('data-cv-document'), html.slice(0, 500));
  assert.ok(html.includes('ỨNG VIÊN GET'));
});

test('POST /api/cv-render rejects malformed JSON', async () => {
  const response = await fetch(`${baseUrl}/api/cv-render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{not-json',
  });

  assert.equal(response.status, 400);
});

test('POST renders through the internal HTTP origin behind an HTTPS proxy', async () => {
  const data = longCvData();
  const target = new URL(baseUrl);
  const response = await fetch(`${baseUrl}/api/cv-render`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-Host': target.host,
      'X-Forwarded-Proto': 'https',
    },
    body: JSON.stringify({ data, templateId: 'tech-modern' }),
  });
  const html = await response.text();

  assert.equal(response.status, 200, html.slice(0, 500));
  assert.ok(html.includes(candidateName));
  assert.ok(html.includes(descriptionMarker));
});
