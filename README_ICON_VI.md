# KODA EUDR Workspace — icon cho tab trình duyệt

Sidebar tiếp tục dùng logo KODA hiện có (`/koda-logo.png`). Icon Workspace mới dùng riêng làm favicon trên tab trình duyệt và icon khi lưu trang trên thiết bị.

## Cập nhật

1. Giải nén gói ZIP.
2. Trong repo GitHub đang nối Netlify, upload đúng 2 file vào thư mục `public/`:
   - `public/index.html` — thay file hiện có bằng file trong gói.
   - `public/eudr-workspace-icon.png` — thêm icon mới hoặc thay file cùng tên nếu đã upload gói trước.
3. Commit changes và đợi Netlify deploy hoàn tất.
4. Mở web và nhấn Ctrl+F5. Nếu tab còn favicon cũ, đóng tab rồi mở lại.

Nếu đã upload gói icon trước đó, bản `index.html` này trả sidebar về logo KODA. File `workspace-brand.css` từ gói trước không còn được trang sử dụng và có thể để nguyên.

Gói này không đổi `app.js`, `i18n.js`, `style.css`, mã xác thực, Apps Script, cấu hình Firebase hoặc dữ liệu Sheet.
