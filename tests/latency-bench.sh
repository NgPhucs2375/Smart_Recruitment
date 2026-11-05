#!/usr/bin/env bash
# Do latency cho backend HireAI. Chi chay GET (doc), khong tao/xoa du lieu.
set -u
API=http://localhost:8000
PROXY=http://localhost:3001
RUNS=${RUNS:-5}

TOKEN=$(curl -s -X POST $API/api/account/authenticate \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@gmail.com","password":"123Pa$$word!"}' \
  | grep -o '"JWToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then echo "LOGIN FAIL"; exit 1; fi
echo "token ok (length ${#TOKEN})"

measure() {
  label="$1"; url="$2"; runs="${3:-$RUNS}"
  fmt='%{time_starttransfer}|%{time_total}|%{size_download}\n'
  out=""
  for i in $(seq 1 "$runs"); do
    out+=$(curl -s -o /dev/null -H "Authorization: Bearer $TOKEN" -w "$fmt" "$url")
    out+=$'\n'
  done
  echo "$out" | awk -F'|' -v L="$label" '
    NF==3 && $1!="" { ttfb[NR]=$1; tot[NR]=$2; bytes=$3; n++; tt+=$1; ttot+=$2 }
    END { if (n==0) { printf "%-38s  NO DATA\n", L; exit }
          printf "%-38s  n=%d  TTFB trung bình %6.0f ms  |  toan bo %6.0f ms  |  %8.1f KB\n",
                 L, n, (tt/n)*1000, (ttot/n)*1000, bytes/1024 }'
}

echo
echo "### 1. Backend goi TRUC TIEP (port 8000)"
measure "Dashboard admin (nang nhat)"   "$API/api/admin/dashboard?days=30"
measure "Danh sach tin tuyen dung"      "$API/api/tintuyendungs?_start=0&_end=100"
measure "Danh sach CV ung vien"         "$API/api/cvungviens?_start=0&_end=100"
measure "Thong bao"                     "$API/api/Notifications?pageNumber=1&pageSize=15"

echo
echo "### 2. Cung endpoint nhưng di qua FE proxy (/api/dotnet/*, port 3001)"
measure "Dashboard admin  qua proxy"    "$PROXY/api/dotnet/admin/dashboard?days=30"
measure "Tin tuyen dung   qua proxy"    "$PROXY/api/dotnet/tintuyendungs?_start=0&_end=100"

echo
echo "### 3. Login (luong co gui email)"
measure "POST authenticate" "$API/api/account/authenticate" 3
