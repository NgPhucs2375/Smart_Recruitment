# HireAI — Deploy lên GCP VM (Docker Compose + Nginx)

Kiến trúc: browser → Nginx (`:80`) → `frontend:3000` (Next standalone) → `backend:8080` (nội bộ, qua `DOTNET_API_URL`). MinIO mở cổng `9000` trực tiếp cho presigned URL (không qua Nginx — rewrite path sẽ vỡ chữ ký).

## 1. Chuẩn bị SSH Key (máy dev của bạn)

```bash
# Tạo key mới (Enter hết để dùng default, đặt passphrase tùy ý)
ssh-keygen -t ed25519 -C "hireai-gcp-deploy" -f ~/.ssh/hireai_gcp

# Copy public key lên VM (thay USER và IP-VM)
ssh-copy-id -i ~/.ssh/hireai_gcp.pub USER@IP-VM

# Test đăng nhập không mật khẩu
ssh -i ~/.ssh/hireai_gcp USER@IP-VM
```

Giữ file private `~/.ssh/hireai_gcp` cẩn thận — nội dung nó là secret `GCP_SSH_PRIVATE_KEY` bên dưới (copy NGUYÊN file, gồm cả dòng `-----BEGIN/END-----`).

## 2. Chuẩn bị máy VM Ubuntu (chạy 1 lần)

```bash
# Docker + compose plugin
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER && newgrp docker

# Firewall GCP (Console -> VPC -> Firewall HOẶC ufw trên máy):
# mở 22 (SSH), 80 (web), 443 (dự phòng TLS), 9000 (MinIO), 9001 (MinIO console)
sudo ufw allow 22,80,443,9000,9001/tcp && sudo ufw enable

# Thư mục app
mkdir -p ~/hireai && cd ~/hireai
```

## 3. File `.env.prod` trên VM (KHÔNG commit — tạo tay trên máy VM)

Tạo `~/hireai/.env.prod` với nội dung sau (thay giá trị thật, IP-VM = IP public của máy):

```env
# --- Bắt buộc ---
POSTGRES_PASSWORD=<mat-khau-postgres-manh>
JWT_KEY=<base64-it-nhat-32-bytes>            # vd: openssl rand -base64 48
MINIO_ROOT_USER=hireai-minio
MINIO_ROOT_PASSWORD=<mat-khau-minio-16-ky-tu-tro-len>
MINIO_PUBLIC_ENDPOINT=https://<domain>
FRONTEND_ALLOWED_ORIGINS=https://<domain>

# --- AI / Mail / Google (để trống = tính năng đó tắt, app vẫn chạy) ---
GEMINI_API_KEY=<google-ai-studio-api-key>
GEMINI_MODEL=gemini-3.6-flash-lite
GEMINI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/openai/
MAIL_SMTP_HOST=
MAIL_SMTP_PORT=587
MAIL_USER=
MAIL_PASS=
MAIL_FROM=
MAIL_DISPLAY_NAME=HireAI
GOOGLE_CLIENT_ID=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
COPILOTKIT_THREADS_ENABLED=
JWT_ISSUER=Identity
JWT_AUDIENCE=IdentityUser
JWT_DURATION=60
```

Phân quyền: `chmod 600 ~/hireai/.env.prod`.

## 4. Secrets trên GitHub (Settings → Secrets and variables → Actions)

| Secret | Giá trị |
|---|---|
| `GCP_VM_HOST` | IP public của VM (vd: `34.123.45.67`) |
| `GCP_VM_USER` | User SSH (vd: tên user Ubuntu của bạn) |
| `GCP_SSH_PRIVATE_KEY` | Toàn bộ file `~/.ssh/hireai_gcp` (kể cả BEGIN/END) |

(Không cần thêm secret nào khác — `GITHUB_TOKEN` GitHub tự cấp cho bước clone.)

Sau đó: push vào nhánh `main` → tab Actions theo dõi `CI/CD — GCP VM` → xong thì mở `http://<IP-VM>` kiểm tra.

## 5. Lệnh vận hành trên VM

```bash
cd ~/hireai
docker compose --env-file .env.prod -f docker-compose.prod.yml ps            # trạng thái
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f backend   # log BE
docker exec hireai-backend wget -qO- http://localhost:8080/health/live   # BE health
curl -fsS http://localhost/ -o /dev/null && echo "WEB OK"   # qua Nginx
# Rollback bản cũ: git reset --hard <commit-cu> && docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

## 6. Gắn domain + HTTPS (đã áp dụng cho hireais.dev)

1. DNS: `A @ -> IP-VM` và `A www -> IP-VM`.
2. Firewall GCP: chỉ cần rule cho cổng `80` và `443`. **Không** mở `9000` —
   trình duyệt không còn chạm thẳng MinIO (xem mục 5).
3. Cert: `sudo mkdir -p /var/www/certbot && sudo apt-get install -y certbot` rồi
   `sudo certbot certonly --webroot -w /var/www/certbot -d hireais.dev -d www.hireais.dev`.
   Cert nằm ở `/etc/letsencrypt/live/hireais.dev/`. nginx đã mount sẵn
   `/etc/letsencrypt` và `/var/www/certbot` (volume trong `docker-compose.prod.yml`);
   block 443 trong `deploy/nginx/nginx.conf` chỉ thẳng vào `fullchain.pem`/`privkey.pem`
   nên không cần bỏ comment hay copy cert đi đâu.
4. `.env.prod`: `FRONTEND_ALLOWED_ORIGINS=https://hireais.dev` — chỉ origin HTTPS apex,
   vì http:// và www:// đã bị nginx 301 về apex (thêm origin khác vào allow-list là backend
   từ chối `Địa chỉ frontend không được phép` với request thật).
   `MINIO_PUBLIC_ENDPOINT=https://hireais.dev` — **có scheme**: scheme quyết định TLS của
   presigned URL; `Minio__UseSSL` vẫn là `false` vì backend↔MinIO đi http trong docker network.
5. Presigned URL: `MinioFileStorageService.CreatePresignedUrlAsync` sinh
   `https://hireais.dev/smart-recruitment-files/<object>?X-Amz-...`. SigV4 ký theo
   `Host` + path, nên nginx phải forward nguyên URI và giữ `Host: hireais.dev`
   (`location ^~ /smart-recruitment-files/`). Đổi `Minio__BucketName` thì đổi luôn prefix
   location. Kiểm chứng route thông:
   `curl -s -o /dev/null -w '%{http_code}\n' "https://<domain>/smart-recruitment-files/khong-ton-tai.pdf"`
   → 403/404 kiểu S3 (chữ ký sai/thiếu key), không phải 200 HTML của Next.
6. OAuth provider: Google Cloud Console → Credentials → OAuth client →
   **Authorized JavaScript origins** thêm `https://hireais.dev` (consent screen còn ở
   Testing thì nhớ thêm email test). GitHub OAuth App → callback
   `https://hireais.dev/auth/github/callback`, rồi khai báo vào `.env.prod`:
   `GITHUB_CLIENT_ID` (dùng cho cả backend `GitHubSettings__ClientId` và build arg
   `NEXT_PUBLIC_GITHUB_CLIENT_ID`) + `GITHUB_CLIENT_SECRET` (chỉ server đọc, không bao
   giờ vào repo/chat). Thiếu 2 biến này thì nút GitHub báo "chưa được cấu hình" — chủ ý,
   app vẫn chạy. Vì client id bake vào bundle lúc build, đổi nó phải
   `up -d --build frontend`.
7. Renew tự động: `sudo crontab -e` thêm
   `0 3 * * * certbot renew --quiet --deploy-hook "docker restart hireai-nginx"`.


## 7. Lưu ý đã biết

- `GET /api/hubs/notifications 500` với `loadManifest ... Unexpected end of JSON input` từng gặp ở dev là do `.next` corrupt — trên VM build sạch từ image nên không dính; nếu gặp, `docker compose ... up -d --build frontend`.
- Lần deploy đầu BE chạy migrations + seeders (có thể 1–3 phút mới `healthy`).
- Không commit `.env.prod`, không commit key SSH.
