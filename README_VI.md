# KODA EUDR WORKSPACE 2.1 — staging candidate

Nâng cấp trực tiếp từ `KODA_EUDR_2.0_UI_Redesign_Staging_2026-10-06.zip`. Cấu trúc GitHub → Netlify → Netlify Functions → HMAC → Apps Script → Sheet/Drive/Calendar được giữ nguyên. Đây là gói **chuẩn bị staging**, chưa phải bản đã triển khai và chưa có quyết định tuân thủ EUDR.

## Bắt đầu

1. Tạo nhánh `upgrade/eudr-workspace-v2-1` từ commit đang chạy; lưu bản sao mã, cấu hình, Apps Script deployment và workbook trước thay đổi.
2. Giải nén gói vào repo hiện hành, giữ cấu trúc thư mục. Không dùng lại `changes.patch` hoặc bảng QA của bản 2.0 như kết quả nghiệm thu bản này.
3. Chạy `npm ci`, `npm run check`, `npm test` trên Node ≥20.
4. Cập nhật mã `.gs` vào Apps Script staging (chưa phát hành), sao lưu **staging workbook** và chạy `migrateV21()` bằng tài khoản ADMIN trong Apps Script. Chỉ bốn cột metadata được thêm vào cuối `05_OWNER_MASTER`: `auth_provider`, `auth_uid`, `must_change_password`, `password_changed_at`. Hàm kiểm tra header trước khi sửa; các dòng cũ không bị ghi lại.
5. Triển khai Apps Script staging phiên bản mới; cập nhật URL deployment staging ở Netlify. Đặt cùng `BRIDGE_SECRET`, `ALLOWED_ORIGINS` ở hai phía. Giữ cờ `LEGACY_TOKEN_LOGIN=false` cho trải nghiệm mới.
6. Tạo dự án Firebase staging, bật Authentication → Email/Password, thêm domain staging vào Authorized domains. Tạo service account chỉ trên máy chủ, không đưa JSON vào repo.
7. Đặt các biến trong Netlify staging: `APPS_SCRIPT_WEBAPP_URL`, `BRIDGE_SECRET`, `ALLOWED_ORIGINS`, `FIREBASE_PROJECT_ID`, `FIREBASE_WEB_API_KEY`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `LEGACY_TOKEN_LOGIN=false`. `FIREBASE_WEB_API_KEY` là cấu hình công khai của Firebase; service account và bridge secret phải là secret server-side.
8. Triển khai Netlify staging và kiểm tra `GET /api/auth` trả `enabled:true`. Đăng nhập bằng tài khoản ADMIN đã provision trong Firebase và có dòng active trong `05_OWNER_MASTER`. Với tài khoản ADMIN đầu tiên, tạo thủ công trong Firebase console rồi chạy `bootstrapFirebaseAdmin(uid)` bằng chính tài khoản ADMIN trong Apps Script staging để ghi metadata và audit; không tạo mật khẩu trong Sheet. Sau đó dùng Users → Provision Login cho các tài khoản khác.
9. Chạy checklist trong `DEPLOYMENT_V2_1.md`, ký xác nhận pháp lý và nghiệp vụ, mới cân nhắc migration/deploy production.

> `migrateV2()` là migration nền của gói trước. Workbook hiện tại đã có các tab và header V2. Không chạy lại `setup()` hoặc sửa header production bằng tay.

## Thay đổi chính

- Đăng nhập Firebase Email/Password, xác thực ID token tại Netlify, ràng buộc Firebase UID với email trong `05_OWNER_MASTER`; Sheet vẫn là nguồn quyền truy cập. Mật khẩu tạm chỉ hiển thị một lần khi Admin provision; người dùng phải đổi trước khi vào workspace.
- EN/VI với dictionary `public/i18n.js`, lựa chọn lưu trong `localStorage`, đổi ngôn ngữ ngay trên login/top bar.
- Create Order có kiểm tra thư mục hiện hữu, trạng thái đang xử lý, thành công, lỗi và retry giữ request key. Không có phần trăm giả cho xử lý Apps Script.
- AI Assistant lấy workbook ID, order folder ID, document file ID và version từ các bản ghi backend hiện hành, kèm tab đọc, tab đích, chế độ PREPARE_FOR_HUMAN_REVIEW và ranh giới phê duyệt. Kết quả DOCUMENT_REVIEW được xếp vào `07_AI_REVIEW_QUEUE` để người phụ trách rà soát, không tự duyệt.
- Legal Settings yêu cầu phiên bản, nguồn EUR-Lex và người rà soát có tên trước khi ADMIN xác nhận quy tắc. Không tự đặt `RULES_CONFIRMED=YES`.

## Giới hạn đã biết

- Kiểm thử Firebase thật, email reset, Netlify/Apps Script staging, nhiều vai trò trên desktop/tablet/mobile và tình huống timeout phải chạy sau khi có cấu hình staging. Kết quả test cục bộ không thay thế UAT.
- Ứng dụng dùng các bản dịch cố định cho luồng chính và nhiều màn hình; rà soát bản dịch đầy đủ của mọi biểu mẫu/empty state theo vai trò vẫn là điều kiện nghiệm thu trước production.
- PDF tạo đơn trực tiếp hiện giới hạn 3 MB; upload evidence đã có đường chunked tối đa 25 MiB. Không mở rộng giới hạn PDF tạo đơn trong thay đổi này.
- Những cột auth mới chưa được viết vào workbook thật; migration chỉ nằm trong mã staging.

Xem [DEPLOYMENT_V2_1.md](DEPLOYMENT_V2_1.md) để xem audit, checklist, trình tự triển khai, rollback và nguồn EU.
