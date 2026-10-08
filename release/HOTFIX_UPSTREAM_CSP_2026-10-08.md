# KODA EUDR v2.3.1 — lỗi cập nhật 502 và CSP

**Ngày:** 8/10/2026  
**Phạm vi:** bản mã staging v2.3.1, không xác nhận đã triển khai production.  
**Mã lỗi người dùng cung cấp:** `0c199ca5-1160-4e64-875c-0b0537417bbf`.

## Kết luận từ dữ liệu hiện có

- `/api/call` trả 502 khi bridge nhận HTTP không thành công, HTML/đầu ra không phải JSON, cấu trúc JSON khác dự kiến, hoặc lỗi mạng đến Apps Script. Màn hình console không cho biết HTTP upstream thực tế của mã lỗi trên. Cần tra Netlify Function log theo thời điểm và mã tham chiếu, rồi đối chiếu Apps Script Executions và tình trạng bản `/exec` đang triển khai. Trước bản này, nhánh bridge chưa ghi loại lỗi upstream đủ để phân biệt các trường hợp.
- Thông báo `about:srcdoc` về inline script/style xuất hiện trên đường xem trước PDF bằng iframe/blob của bản staging trước. Đây là luồng trình xem PDF của Chromium, độc lập với HTTP 502 ở `/api/call`; không có bằng chứng cho thấy CSP gây 502.
- Thao tác cập nhật có thể đã ghi vào Sheet trước khi phản hồi upstream mất. Vì vậy không tự gửi lại mutation khi gặp 502/504. Mã `requestKey` của lần thao tác được giữ lại, và giao diện giữ biểu mẫu cùng nhắc kiểm tra bản ghi mới nhất trước khi thử lại.

## Thay đổi trong gói

| Tệp | Thay đổi |
| --- | --- |
| `netlify/functions/call.mjs`, `_bridge.mjs` | Theo redirect ContentService, timeout 45 giây; phân loại upstream HTTP, non-JSON, format, timeout, network. Log chỉ có requestId/action/loại lỗi/status/content-type/hostname/thời gian; không log payload, token hoặc nội dung phản hồi. |
| `public/app.js`, `public/i18n.js` | Hiện mã lỗi và requestId; trạng thái lưu chưa chắc chắn khi 5xx; giữ form để đối chiếu. Dọn tài nguyên PDF khi đóng drawer. |
| `public/pdf-preview.mjs`, `public/vendor/pdfjs/`, `public/style.css` | Thay iframe PDF bằng PDF.js tự lưu trên cùng origin, worker cùng origin và canvas; có chuyển trang, thông báo lỗi và đường tải file gốc. Chặn tạo font style động. |
| `netlify.toml` | Giữ `style-src 'self'`, `script-src 'self'` và cấm inline; cho phép riêng `wasm-unsafe-eval` để giải mã ảnh PDF, `worker-src 'self'`; không dùng `unsafe-inline` hoặc `unsafe-eval`. |

## Kết quả kiểm tra

- `npm run check`: đạt.
- `npm test`: 7/7 bộ kiểm thử đạt; bao gồm HTTP 503, HTML, timeout, JSON sau redirect, không lộ nội dung upstream trong log, không tự gửi lại mutation, và preview canvas không có iframe/style inline.
- `npm run test:pdf`: 7/7 kiểm thử PDF đạt.
- Trình duyệt thực với CSP production chưa được nghiệm thu vì cài Chromium trong môi trường này thất bại; cần thử một PDF văn bản và một PDF scan trên staging.
- Không truy cập được log Netlify hay Apps Script production, nên nguyên nhân cụ thể của mã `0c199ca5-1160-4e64-875c-0b0537417bbf` chưa được chứng minh. Không thể tuyên bố đã khắc phục lỗi 502 production từ gói mã này.

## Kiểm tra sau khi triển khai staging

1. Xác nhận `APPS_SCRIPT_WEBAPP_URL` trỏ đúng Web App `/exec`, quyền truy cập triển khai và `BRIDGE_SECRET` khớp backend; không chép giá trị secret vào ticket/log.
2. Lặp thao tác cập nhật trên bản ghi thử nghiệm; xác nhận kết quả qua tải lại dữ liệu. Nếu 5xx, tìm `APPS_SCRIPT_UPSTREAM` bằng requestId trong Netlify Function log; đối chiếu thời điểm với Apps Script Executions. Xem `kind`, `httpStatus`, `contentType` và `host`; kiểm tra deployment/quota/exception tương ứng.
3. Thử preview PDF văn bản và PDF scan; kiểm tra console không còn `about:srcdoc` CSP violation và Download vẫn dùng được. Kiểm tra response header CSP thực tế của site.
4. Nếu cập nhật vẫn lỗi, giữ nguyên bản ghi để đối chiếu trước khi retry. Thu thập requestId, giờ UTC, tên action, trạng thái HTTP upstream đã lược bỏ thông tin nhạy cảm; không gửi token, tài liệu hoặc payload khách hàng.

**Giới hạn phát hành:** Đây là gói staging để review/triển khai; chưa có Netlify build ID, Apps Script version ID, log production hoặc kết quả UAT trực tiếp. Các cổng migration v2.3 và ACL chia sẻ Drive trong báo cáo nghiệm thu v2.3 vẫn cần xử lý trước khi tuyên bố production acceptance.
