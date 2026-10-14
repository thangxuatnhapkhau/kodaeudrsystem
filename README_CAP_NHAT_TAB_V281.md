# KODA EUDR v2.8.1 — chatbot thành tab trong Order

Đây là bản cập nhật giao diện cho gói v2.8.0 đã giao trước đó. Chỉ thay 5 file dưới đây trong GitHub repository, giữ nguyên các file Apps Script và Netlify function.

| Đường dẫn | Thay đổi |
| --- | --- |
| `public/app.js` | Đưa Ask KODA AI thành tab dưới thông tin Order; bỏ nút mở cửa sổ trong EUDR Dossier Check. |
| `public/workspace-chat.js` | Hiển thị hội thoại trực tiếp trong tab, lịch sử câu trả lời ở cột bên, nguồn và form hỏi trong trang; dừng OCR đang chạy khi rời Order/tab. |
| `public/style.css` | Bố cục tab và hội thoại phù hợp màn hình máy tính, tự thu gọn trên màn hình nhỏ. |
| `public/i18n.js` | Nhãn tab và trạng thái trống EN/VI. |
| `public/index.html` | Tăng phiên bản tải JS để tránh trình duyệt giữ file cũ. |

**Cách áp dụng:** Chép đúng 5 file vào `public/` của bộ code đã cập nhật v2.8.0, commit và để Netlify build lại. Vào một Order, chọn tab **Ask KODA AI** bên cạnh **Evidence workspace**. Chọn phạm vi Order/material/PO-lot, lập chỉ mục các PDF mới khi cần và hỏi trực tiếp trong tab. Không cần migration hoặc deploy lại Apps Script nếu v2.8.0 đã được cài đầy đủ.

Tab vẫn dùng cùng quyền `AI_USE`, dữ liệu Sheet/PDF, AI worker và kết quả đã lưu của v2.8.0. Lịch sử câu trả lời không bị xóa. Đã kiểm tra cú pháp JS và các bài kiểm tra giao diện/tab, OCR/dossier liên quan. Chưa triển khai Netlify production trong phiên này.
