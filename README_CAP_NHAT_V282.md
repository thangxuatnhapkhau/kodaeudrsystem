# KODA EUDR v2.8.2 — sửa tab AI báo 0 PDF ở material

Áp dụng sau gói v2.8.0 và tab v2.8.1. Gói này chỉ có các file cần thay, không cần migration Sheet.

## File cập nhật

| Nơi cập nhật | File |
| --- | --- |
| Apps Script | `apps_script/WorkspaceChatService.gs` |
| GitHub | `public/workspace-chat.js`, `public/i18n.js`, `public/style.css`, `public/index.html` |

## Thay đổi

- Khi mở tab **Ask KODA AI**, phạm vi mặc định là **Whole Order** để hiển thị các PDF đã đăng ký trong Order; người dùng có thể chọn lại **Selected material** hoặc PO/lô.
- Material/PO-lot nhận diện cả PDF có quan hệ qua evidence task, nguồn PO/lô hoặc liên kết chứng từ; không chỉ dựa vào cột `material_id` trực tiếp.
- PDF tách (`DOSSIER_PART`) được tính trong material nếu PDF gốc chỉ ở cấp Order. Ở phạm vi Whole Order, bản tách và PDF gốc không bị đếm hai lần.
- Khi phạm vi material không có PDF nhưng Order có, giao diện hiển thị thông báo và nút chuyển nhanh về Whole Order. Khi Whole Order cũng có 0 PDF, giao diện chỉ rõ chưa có PDF *được đăng ký* để AI đọc.

PDF có trong Drive nhưng chưa được đăng ký trong `06_DOCUMENT_REGISTER` sẽ không tự xuất hiện ở tab AI. Bản này không tự quét và tạo liên kết cho mọi file rời trong thư mục Drive. Các PDF đã đăng ký và có SHA-256 không cần upload lại; chỉ cần lập chỉ mục khi chưa OCR.

## Cách áp dụng

1. Thay `WorkspaceChatService.gs` trong Apps Script và deploy **New version** của web app.
2. Thay 4 file `public/` trong repository, commit để Netlify build lại.
3. Mở lại Order → **Ask KODA AI**. Kiểm tra **Whole Order** có PDF, sau đó chọn material. Nếu material báo 0 nhưng Order có file, kiểm tra liên kết task/PO-lot của chứng từ.

Đã kiểm tra cú pháp JS, 119 bài kiểm tra liên quan và tính toàn vẹn ZIP. Chưa chạy end-to-end với tài khoản Drive/Sheet production hoặc deploy trực tiếp trong phiên này.
