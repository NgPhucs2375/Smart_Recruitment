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
RABBITMQ_USER=hireai
RABBITMQ_PASSWORD=<mat-khau-rabbitmq>
MINIO_ROOT_USER=hireai-minio
MINIO_ROOT_PASSWORD=<mat-khau-minio-16-ky-tu-tro-len>
MINIO_PUBLIC_ENDPOINT=http://<IP-VM>:9000
FRONTEND_ALLOWED_ORIGINS=http://<IP-VM>

# --- AI / Mail / Google (để trống = tính năng đó tắt, app vẫn chạy) ---
GROQ_API_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=
MAIL_SMTP_HOST=
MAIL_SMTP_PORT=587
MAIL_USER=
MAIL_PASS=
MAIL_FROM=
MAIL_DISPLAY_NAME=HireAI
GOOGLE_CLIENT_ID=
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

## 6. Khi có domain (làm sau — checklist)

1. Trỏ DNS `A @ -> IP-VM` (và `A minio -> IP-VM` nếu muốn console đẹp, không bắt buộc).
2. Trên VM: `sudo apt-get install -y certbot && sudo certbot certonly --webroot -w /var/www/certbot -d <domain>`.
3. Bỏ comment 2 volume certs trong `docker-compose.prod.yml` + block `443` trong `deploy/nginx/nginx.conf` (thay `<DOMAIN>`), tạo `deploy/nginx/certs/` chứa `fullchain.pem` + `privkey.pem`, compose up lại.
4. Đổi secrets/env: `FRONTEND_ALLOWED_ORIGINS=https://<domain>`, `MINIO_PUBLIC_ENDPOINT` sang `https://...` (lúc này **bắt buộc** MinIO qua TLS — xem lại `Minio__UseSSL=true` + cert cho MinIO, hoặc chuyển sang subdomain `minio.<domain>`).
5. Cron renew: `0 3 * * * certbot renew --quiet && docker restart hireai-nginx`.

## 7. Lưu ý đã biết

- `GET /api/hubs/notifications 500` với `loadManifest ... Unexpected end of JSON input` từng gặp ở dev là do `.next` corrupt — trên VM build sạch từ image nên không dính; nếu gặp, `docker compose ... up -d --build frontend`.
- Lần deploy đầu BE chạy migrations + seeders (có thể 1–3 phút mới `healthy`).
- Không commit `.env.prod`, không commit key SSH.
