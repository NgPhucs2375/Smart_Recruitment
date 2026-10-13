"use client";

// Khởi tạo màn hình tạo-cv 
// render component chính : tao-cv-view
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { TaoCvView } from "@/components/cv/tao-cv-view";

// export default function TaoCvPage() {
//   return (
//     <Suspense
//       fallback={
//         <div className="flex h-96 items-center justify-center gap-2 text-sm text-muted-foreground">
//           <Loader2 className="size-5 animate-spin" />
//           Đang tải trình tạo CV...
//         </div>
//       }
//     >
//       <TaoCvView />
//     </Suspense>
//   );
// }

// mẫu có thêm Microcopy
export default function TaoCvPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 flex-col items-center justify-center gap-3 text-center">
          <Loader2 className="size-6 animate-spin text-primary" />
          
          <div className="space-y-1">
            {/* Primary Copy: Trạng thái chính */}
            <p className="text-sm font-medium text-foreground">
              Đang chuẩn bị không gian làm việc...
            </p>
            
            {/* Secondary Microcopy: Dòng phụ giải thích ngữ cảnh */}
            <p className="text-xs text-muted-foreground">
              Hệ thống đang tải các mẫu giao diện và cấu hình biên tập
            </p>
          </div>
        </div>
      }
    >
      <TaoCvView />
    </Suspense>
  );
}

// <Suspense>: thẻ được dùng để trì hoãn show 1 phần UI người dùng cho đến khi dữ liệu or tài nguyên load xong
// đồng thời hiển thị UI dự phòng - (fallback UI) trong thời gian chờ

//
