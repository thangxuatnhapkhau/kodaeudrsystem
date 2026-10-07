# KODA EUDR 2.1 — Cập nhật giao diện duyệt chứng từ

Bản cập nhật cho gói Firebase `2.1_Staging_2026-10-06` đang dùng tại KODA EUDR Workspace. Đây là gói thay ba tệp giao diện, không phải bộ cài toàn hệ thống.

## Cách cập nhật

1. Giải nén ZIP.
2. Trong repository GitHub đang liên kết với Netlify, thay đúng ba tệp:
   - `public/app.js`
   - `public/style.css`
   - `public/i18n.js`
3. Commit thay đổi, chờ Netlify hoàn tất deploy.
4. Mở lại trang và nhấn Ctrl + F5.

Không cần sửa dữ liệu Google Sheet, biến môi trường, logo hoặc Apps Script để cài bản cập nhật này. Không thay `index.html`: phần logo KODA ở sidebar và favicon bạn đã cập nhật được giữ nguyên.

## Giao diện mới

- Tên tệp, phiên bản hiện hành/cũ và trạng thái được hiển thị ở đầu màn hình.
- Tải xuống, nộp để rà soát và thông tin chứng chỉ nằm trong nhóm thao tác tệp.
- Quyết định duyệt nằm trong khung riêng: phê duyệt màu xanh; yêu cầu bổ sung màu vàng; từ chối viền đỏ. Có nhãn và ký hiệu để phân biệt, không chỉ dựa vào màu.
- Bấm một quyết định chỉ mở bước xác nhận; dữ liệu được ghi sau khi bấm nút xác nhận.
- Từ chối/yêu cầu bổ sung phải có lý do; ghi chú phê duyệt là không bắt buộc, phù hợp quy tắc máy chủ hiện tại.
- Chứng từ đã duyệt hiển thị người rà soát, thời điểm và ghi chú. Chọn “Đổi quyết định duyệt” để mở các quyết định khác.
- Ghi chú quyết định được chia sẻ với nhà cung cấp và lưu trong nhật ký theo hành vi máy chủ hiện có.
- Bình luận có ô riêng và lựa chọn phạm vi nội bộ/chia sẻ nhà cung cấp. Lịch sử phiên bản và bản xử lý thu gọn trong các mục mở rộng.
- Lỗi lưu quyết định hiển thị ngay trong khung duyệt và giữ lại ghi chú đã nhập.
- Hỗ trợ tiếng Việt/Anh và bố cục điện thoại.

## Điều kiện duyệt được giữ nguyên

Chỉ ADMIN/EUDR_REVIEWER trong phạm vi được máy chủ cho phép mới được duyệt. Chỉ phiên bản gốc EVIDENCE đang hiện hành, đã nộp/đang rà soát/đã duyệt được nhận quyết định. Phiên bản cũ không được duyệt; bản đã từ chối hoặc yêu cầu bổ sung cần được thay bằng phiên bản chỉnh sửa và nộp lại theo quy trình hiện tại. Bản che giá/phụ đề dùng luồng kiểm tra bản xử lý riêng.

Phê duyệt chứng từ là kết quả rà soát nội bộ, không phải xác nhận tuân thủ EUDR.

## Kiểm tra đã thực hiện

- `npm run check`: đạt.
- `npm test`: 59/59 đạt, gồm 7 kiểm tra mới cho bước chọn/xác nhận, quyền duyệt, lý do bắt buộc, lỗi và chống gửi lặp.
- 6 nhóm kiểm tra trình duyệt: màu và nhóm thao tác; xác nhận; lý do và giữ ghi chú khi lỗi; trạng thái đã duyệt; phiên bản cũ/quyền; bình luận; màn hình 390 px và chuyển ngôn ngữ.
- Màn hình duyệt chạy với Content Security Policy hiện tại; không thêm script hoặc style nội tuyến.
- Kiểm tra trình duyệt dùng API mô phỏng cục bộ. Ảnh trong `preview/` dùng tài liệu ví dụ; không có chứng từ thật được duyệt và chưa có thay đổi nào được deploy lên trang đang chạy.

Tệp trong `tests/` và `preview/` phục vụ kiểm tra/tham khảo; để cập nhật giao diện chỉ cần thay ba tệp trong `public/`.

## Kiểm tra nhanh sau deploy

Mở chứng từ đã nộp: tải xuống nằm ngoài khung duyệt. Bấm “Phê duyệt chứng từ”: chưa lưu ngay, có bước “Xác nhận phê duyệt”. Bấm “Từ chối chứng từ” hoặc “Yêu cầu bổ sung”: thiếu lý do thì không được xác nhận. Mở chứng từ đã duyệt: thấy kết quả và nút “Đổi quyết định duyệt”.

Nếu cần hoàn tác giao diện, khôi phục ba tệp trên về commit trước và deploy lại. Bản cập nhật không chuyển đổi dữ liệu.
