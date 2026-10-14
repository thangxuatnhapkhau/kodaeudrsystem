# KODA EUDR Workspace v2.8 — gói file cập nhật

Gói này áp dụng lên bộ `KODA_EUDR_WORKSPACE_OFFICIAL/kodaeudrsystem-main` mà người dùng cung cấp ngày 14-10-2026. Giữ nguyên các file không có trong gói. Không cần chạy migration Sheet mới.

## Thay đổi

- **Ask KODA AI** trong Order Workspace: hỏi theo toàn Order, material hoặc PO/lot đang chọn. Dữ liệu gồm các dòng Sheet thuộc phạm vi được phép và PDF đã đăng ký trong Order. PDF được đọc từ Drive, OCR trên trình duyệt và lưu chỉ mục riêng theo document ID + SHA-256 tại `AI_Chat_Index` trong folder Order. Chọn **Index PDFs from Drive** một lần cho những PDF chưa có chỉ mục; có thể hỏi lại sau khi đăng nhập lại. Câu trả lời được lưu bằng AI worker hiện có, nêu nguồn PDF/trang và ID dòng dữ liệu. Khi phạm vi không có PDF, vẫn hỏi được về dữ liệu Sheet. Thêm/thay PDF thì phải lập chỉ mục bản mới. Các PDF chưa đăng ký trong workspace chưa được đưa vào chatbot.
- **EUDR Dossier Check**: với kết quả AI đã lưu trên Drive, các đoạn PDF có nhóm chứng từ và độ tin cậy HIGH được tách thành bản sao PDF theo trang gốc rồi đăng ký thành nhóm chứng từ nháp; đoạn chưa rõ giữ để người dùng xem. Không tự xác nhận evidence hoặc phê duyệt EUDR.
- **Chuỗi cung ứng**: AI có thể đề xuất nhiều supplier và giao dịch theo nhánh cho từng material/PO/lot, kèm trích dẫn PDF và trang. Người dùng phải xem lại toàn bộ danh sách và đánh dấu xác nhận trước khi tạo các supplier, node và edge nháp. Mọi lot, lượng, nguồn gốc và GEO vẫn cần đối chiếu.
- Gồm các cập nhật phụ thuộc của màn material review, dossier và dịch EN/VI từ bản làm việc trước để đồng bộ với mã nguồn đầu vào.

## File cần thay

| Vị trí | File |
| --- | --- |
| Apps Script | `AIService.gs`, `Bridge.gs`, `DossierService.gs`, `MaterialReviewService.gs`, `PromptService.gs` |
| Apps Script mới | `WorkspaceChatService.gs` |
| GitHub `public/` | `app.js`, `i18n.js`, `index.html`, `material-review.js`, `style.css`, `trace.js` |
| GitHub `public/` mới | `workspace-chat.js` |
| GitHub `netlify/functions/` | `call.mjs` |

## Áp dụng

1. Sao lưu code đang chạy. Chép các file theo đúng đường dẫn trong ZIP vào repository và Apps Script project. Tạo file Apps Script mới tên `WorkspaceChatService.gs`.
2. Apps Script: lưu, deploy **New version** của web app; đảm bảo AI worker `processAIJobs` đã được cài và cấu hình AI đang bật. Không chạy migration mới và không thay đổi các biến Netlify hiện có.
3. Đẩy commit GitHub để Netlify build lại. Đăng nhập, mở một Order có material và PDF đã đăng ký; vào **Ask KODA AI**, lập chỉ mục PDF, hỏi thử. Vào **EUDR Dossier Check**, Refresh results from Drive để kiểm tra các nhóm tài liệu nháp và chuỗi được đề xuất.
4. Các credential từng được dán trong hội thoại (khóa service account, bridge secret) cần được xoay vòng ở môi trường tương ứng; gói này không chứa giá trị bí mật.

## Giới hạn và kiểm tra

- PDF phải được đăng ký trong workspace và người hỏi phải có quyền đọc. Với các PDF đã đăng ký, chatbot yêu cầu lập chỉ mục đủ trong phạm vi đã chọn trước khi hỏi để không bỏ sót chứng từ. OCR lần đầu chạy trong tab đang mở; giữ tab hoạt động cho đến khi báo xong. Upload PDF vẫn theo luồng tối đa 100 MB/file hiện có. Các tệp quá lớn để lập chỉ mục OCR (giới hạn 3 MB JSON / giới hạn ký tự AI hiện tại) cần chia PDF.
- Tự tách chỉ áp dụng cho đoạn `HIGH` có nhóm chứng từ rõ, không chứa trang OCR không đọc được. Kết quả AI và mối nối chuỗi chỉ là dữ liệu nháp phục vụ kiểm tra của con người, không phải quyết định đủ điều kiện EUDR.
- Đã kiểm tra cú pháp JavaScript và 114 test liên quan. Chưa thử end-to-end với Drive/Apps Script/Netlify thật hoặc triển khai production trong phiên này.
