# KODA EUDR v2.9.1 — ChatGPT trả kết quả về AI Review

Gói bổ sung cho hệ thống đã cập nhật v2.9.0. Chỉ gồm 7 file runtime cần thay, hướng dẫn này và danh sách SHA-256. Đây không phải toàn bộ website để upload trực tiếp lên Netlify Drop.

## Vấn đề đã sửa

Ảnh báo INVALID_REVIEW_SCHEMA / Missing field at $.model_review_context do người dùng chọn file *_REVIEW_PACK.json trong ô kết quả. Review Pack là đầu vào gửi ChatGPT, không phải kết quả đã kiểm tra. Bản sửa nhận biết nhầm file này và hiển thị hướng dẫn rõ ràng.

Luồng chính không còn yêu cầu chọn file JSON hay bấm Validate and import. Công cụ import thủ công chỉ còn trong phần hỗ trợ của Admin, mặc định thu gọn.

## Cập nhật

1. Sao lưu 7 file hiện tại trước khi thay.
2. Trong Apps Script, thay TOÀN BỘ nội dung của đúng 2 file:
   - apps_script/ReviewBridgeService.gs
   - apps_script/Bridge.gs
3. Save → Deploy → Manage deployments → Edit deployment hiện tại → chọn New version → Deploy. Giữ deployment hiện tại để URL bridge không đổi.
4. Trong thư mục/GitHub repository đang deploy Netlify, chép đè 5 file còn lại đúng đường dẫn:
   - netlify/functions/call.mjs
   - public/intelligence.js
   - public/workspace-chat.js
   - public/i18n.js
   - public/index.html
5. Deploy lại dự án đầy đủ theo cách đang dùng. Không dùng riêng ZIP cập nhật này cho Netlify Drop.
6. Tải lại website bằng Ctrl+F5. Nhãn phiên bản hiển thị v2.9.1.

KHÔNG chạy lại migration. Không thay V290Migration.gs. Không có bảng/cột mới, không đổi dependencies hay biến môi trường. SCHEMA_VERSION tiếp tục là 2.9.0 vì cấu trúc database không đổi.

## Thao tác của người dùng

1. Mở AI Review → Bắt đầu kiểm tra bằng ChatGPT. Yêu cầu được chuẩn bị và sao chép. Nếu trình duyệt chặn clipboard, trang hiển thị yêu cầu đã chọn để người dùng nhấn Ctrl+C.
2. Bấm Mở ChatGPT, dùng đúng workspace có kết nối Google Drive đã được cấp quyền, dán yêu cầu rồi gửi. Không cần tải Review Pack lên máy; yêu cầu đã có link gói đầu vào và đích lưu kết quả.
3. ChatGPT đọc gói hồ sơ, kiểm tra tài liệu rồi dùng kết nối Drive lưu file kết quả vào thư mục được chỉ định trong yêu cầu.
4. Quay lại AI Review để xem nhận xét, trích dẫn và các phát hiện. Không tải hay import JSON thủ công.

Lượt PREPARED tạo trước bản sửa vẫn dùng được: bấm Sao chép yêu cầu gửi ChatGPT trong thẻ đang chờ. Hệ thống chuẩn bị đích nhận cho lượt cũ và tạo lại hướng dẫn từ đúng gói đã lưu. Nếu dữ liệu đã thay đổi, tạo lượt kiểm tra mới.

Trang tự kiểm tra kết quả khi mở AI Review, khi quay lại tab và khoảng 30 giây/lần trong lúc tab hiển thị và còn lượt chờ. Nếu có lỗi kết nối, khoảng kiểm tra tăng tối đa 120 giây. Trang ngừng kiểm tra khi tab ẩn hoặc rời AI Review. Mỗi lần nhận tối đa một kết quả và kiểm tra tối đa ba lượt, có luân phiên để tránh bỏ quên lượt sau. Không chạy AI ngầm khi đóng website.

## Điều kiện kết nối cần xác minh một lần

ChatGPT phải có action đọc Drive và upload file vào đúng thư mục đích; chỉ tìm thấy tên file hoặc link không đủ. Khả năng này phụ thuộc action được bật trong ChatGPT và quyền Google Drive của tài khoản kết nối. Test bằng một hồ sơ được phép sử dụng trước khi áp dụng cho người dùng khác.

Đây là luồng ChatGPT + kết nối Drive, không phải gọi ChatGPT Business như API. Không yêu cầu OpenAI API key hay Gemini API. Bản cập nhật không thay cấu hình, mở quyền chia sẻ hoặc kết nối tài khoản thay người dùng.

Nếu ChatGPT báo NOT_SAVED, kết quả chưa được trả về hệ thống. Nhờ Admin kiểm tra action upload/quyền thư mục; không coi file download trong chat là đã lưu về EUDR. Không bật anyone-with-link chỉ để xử lý lỗi quyền.

## Vị trí và kiểm tra kết quả

Mỗi lượt có thư mục riêng dưới thư mục Order:
AI_Work/Business_Reviews/RETURN_<review_id>/
Tên kết quả: <review_id>_CHATGPT_RESULT.json

ChatGPT được yêu cầu chỉ lưu kết quả vào đúng đích, không ghi Sheets, không đổi file nguồn hoặc sharing. Hệ thống nhận qua bridge có xác thực, đối chiếu JSON Schema, review ID, phạm vi Order/Material/Source, snapshot hash, phiên bản tài liệu và trích dẫn trước khi hiển thị. Giới hạn kết quả 180.000 UTF-8 bytes. Nếu có nhiều file trùng tên, dừng nhận để Admin xử lý, không tự chọn file.

Kết quả AI vẫn cần người có quyền rà soát; không tự APPROVED chứng từ, đóng Issue hoặc kết luận tuân thủ EUDR. Gói kết quả đã nhập được lưu riêng và có mã hash. Chứng từ đổi phiên bản thì kết quả cũ không còn được nhận như kết quả hiện hành.

## Kiểm tra sau deploy

- User thường không thấy ô chọn JSON ở luồng chính; Admin chỉ thấy trong phần hỗ trợ thu gọn.
- Bấm sao chép trên lượt cũ nhận hướng dẫn có link Review Pack, hash và thư mục đích cụ thể.
- ChatGPT lưu thành công file kết quả và trả link thật. Quay lại AI Review thấy kết quả sau khi kiểm tra hợp lệ.
- Nếu nhập nhầm Review Pack bằng công cụ Admin, thông báo giải thích đây là đầu vào.
- Chứng từ vẫn giữ trạng thái duyệt hiện tại; không có phê duyệt tự động.

## Validation và giới hạn

251 kiểm tra JavaScript cục bộ đã qua, gồm 23 kiểm tra bổ sung về nhận kết quả, quyền, phạm vi, hash/phiên bản, file sai loại, file trùng/ quá lớn, retry, giao diện tự đồng bộ và dừng khi ẩn tab. Kiểm tra cú pháp Apps Script/frontend/Netlify đã qua. Các kiểm tra dùng dữ liệu giả lập và service stubs; chưa chạy end-to-end ChatGPT–Drive trên dữ liệu production. Không có production deployment, migration, thay quyền Drive hoặc gọi AI được thực hiện trong quá trình tạo gói này.

Tài liệu OpenAI đã đối chiếu ngày 15/10/2026:
- https://learn.chatgpt.com/docs/build-plugins
- https://learn.chatgpt.com/docs/enterprise/shared-connections
Các action/kết nối có thể khác giữa Chat và Work; cần thử trong đúng nơi user sử dụng.

## Rollback

Khôi phục đúng 7 file từ bản sao trước cập nhật rồi deploy lại Apps Script và Netlify. Không rollback database: bản này không sửa cấu trúc hoặc migration. Không xóa Review Pack/kết quả đã lưu; lịch sử kiểm tra vẫn ở database v2.9.0.
