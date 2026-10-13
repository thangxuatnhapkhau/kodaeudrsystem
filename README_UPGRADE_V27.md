# KODA EUDR v2.7.0 — gói chỉ các file cần cập nhật

Gói này nâng cấp bộ v2.6 hiện có trên GitHub / Apps Script / Netlify. Đây là bản code đã kiểm thử cục bộ; chưa được triển khai vào Sheet, Apps Script hoặc website production của bạn. Không chứa credentials, dữ liệu thật, node_modules hay toàn bộ thư viện OCR/PDF.js.

## Cài đặt theo đúng thứ tự

1. Sao lưu workbook EUDR SYSTEM và giữ lại code/deployment Apps Script v2.6 cùng commit GitHub hiện tại. Thực hiện khi không có người đang import/upload/chỉnh sửa đơn hàng.
2. Chép các file trong `apps_script/` vào **project Apps Script đang dùng**, thay nội dung file cùng tên. Thêm mới `TraceService.gs` và `MaterialReviewService.gs`. Giữ các file `.gs` không nằm trong gói này. Không tạo một project mới, không chạy `setup`, không thay DB_ID, ROOT_ID hoặc CALENDAR_ID đang hoạt động.
3. Save project. Chọn **previewV27Migration** trong dropdown và Run bằng tài khoản deploy đang là ADMIN active ở `05_OWNER_MASTER`. Đọc Execution log: `dryRun: true`, chỉ append cột/tạo tab, không sửa dữ liệu nghiệp vụ. Nếu báo SCHEMA_MISMATCH, dừng và đối chiếu header; không sửa bằng cách xóa tab/dữ liệu.
4. Chọn **applyV27Migration** và Run. Kết quả `version: 2.7.0`, `dryRun: false`, `records_changed: 0`. Hàm có thể chạy lại; không nhân bản nguồn PO/lô hoặc tự đoán quan hệ cũ. Tab mới: 29_MATERIAL_SOURCES, 30_PRODUCT_MATERIAL_USAGE, 31_SOURCE_EDGES, 32_MATERIAL_REVIEWS, 34_SOURCE_RECORD_LINKS. Không có tab 33 trong bản này.
5. Nếu dùng tự gọi AI: cấu hình trong **Apps Script Script Properties**: `AI_ENABLED=true`, `GEMINI_API_KEY`, `AI_MODEL` phù hợp tài khoản của bạn. Chạy **installAIWorker** bằng Admin. Giữ Drive API và Advanced Calendar API của project hiện có. Có thể điều chỉnh AI_MAX_INPUT_CHARS / AI_MAX_JOBS_PER_DAY / AI_MAX_USER_JOBS_PER_DAY theo nhu cầu và chi phí. Key không đặt trong frontend.
6. Apps Script: **Deploy → Manage deployments → Edit → New version → Deploy** cho Web App hiện tại, giữ execution identity/access như bridge đang hoạt động. Khi cập nhật deployment hiện tại, URL thường giữ nguyên; nếu tạo deployment mới, cập nhật APPS_SCRIPT_WEBAPP_URL tại Netlify.
7. Chép các file `public/`, `netlify/functions/`, package.json và package-lock.json vào repository GitHub đúng các đường dẫn tương ứng; giữ các file còn lại. Commit/push để Netlify build lại. Gói đã dùng cache marker `v=2.7.0` cho các module thay đổi. Không xóa `public/vendor`, template Excel hoặc ảnh/logo cũ.
8. Đăng nhập lại và kiểm tra các bước ở `docs/V27_ACCEPTANCE.md`. Website phải hiện v2.7.0. Không kết luận đã triển khai thành công chỉ từ thông báo build xanh.

Nếu dropdown vẫn chỉ thấy migrateV2414: kiểm tra đã thêm và Save **TraceService.gs**, không còn syntax error trong editor, rồi reload editor. Hai hàm mới không cần truyền tham số khi Run: previewV27Migration và applyV27Migration.

## Cách dùng nguồn material và product

- Trong Order Workspace, mở **Product · Material · PO / lot**. Chọn material, tạo nguồn với supplier, **PO mua nguyên liệu**, PO line, lot/batch, quantity/UOM, quốc gia khai thác ISO alpha-2 và khoảng ngày khai thác. SKU/PO# của product hoặc customer PO không thay cho supplier material PO.
- Phân bổ nguồn vào đúng product. Product 1 → Solid Wood / PO1 / L1; Product 2 → Solid Wood / PO2 / L2 và Walnut Veneer / PO3 / L3. Click từng product chỉ hiện material của nó và những nguồn đã phân bổ. Có thể chia một lot cho nhiều product; tổng phân bổ cùng UOM không được vượt lượng nguồn đã khai báo.
- Liên kết cũ `material.product_ids` vẫn dùng để xác định material của product nếu đã có. Material chưa có liên kết rõ không tự xuất hiện ở mọi product. Cần xác nhận nguồn PO/lô riêng; migration không dùng tên material để tự ghép lot.
- Nguồn chưa rõ PO/lot vẫn lưu riêng, có blocker SOURCE_IDENTITY_UNRESOLVED. Các nguồn giống tên/PO không tự hợp nhất. Muốn dùng lại cùng lot thực tế, phân bổ **cùng source ID**, không tạo bản sao.
- NON_WOOD được giữ trong preview/audit import nhưng không tạo material/folder/task. Product xác nhận chỉ có NON_WOOD được ghi wood_content_state=NON_WOOD_ONLY. UNKNOWN và mô tả trộn wood/non-wood giữ để review; không âm thầm loại bỏ gỗ.

## Chuỗi nhiều nhánh và hồ sơ theo nguồn

1. Tạo các supplier/forest node; node là bên tham gia, không phải một giao dịch mua hàng. Trong giao diện nguồn, thêm giao dịch **upstream → downstream → KODA** với lot tại hai đầu, số INV/shipment, quantity/UOM và chứng từ. Mỗi supplier có thể có nhiều đầu vào. Tier được suy theo từng đường truy xuất; không dùng parent_id cũ để kết luận graph mới đã kín.
2. Các giao dịch phải nối theo **node + lot**, và kết thúc ở lot của nguồn đã chọn. Graph chặn vòng lặp theo genealogy lot, báo nhánh rời, gap upstream, thiếu GEO/chứng từ, quantity/đơn vị không thể đối chiếu hoặc tổng output vượt input. Không tự tính tỷ lệ trộn hay hệ số chuyển đổi.
3. Dùng **Gắn chứng từ, GEO, task vào đúng PO/lô**. Chứng từ chung/plot chung có thể được liên kết rõ vào nhiều source mà không upload/copy bytes lại. Liên kết task sang source thứ hai tạo task mới MISSING, giữ nguyên chứng từ/approval của source thứ nhất.
4. Mở **EUDR Dossier Check** trong Order. Chọn material/source. Upload nhiều PDF hoặc chọn PDF đã gắn nguồn từ Drive, tối đa 20 file/lần, 100 MB/file. Upload qua relay cùng origin; hỗ trợ resume cùng file và SHA-256. PDF đã upload từng phần không bị mất khi một file khác thất bại.
5. Có thể **Gắn PDF vào evidence task** khi toàn bộ file phù hợp với một task và được phép cho người được giao task đọc. Bản evidence dùng lại file trên Drive, trạng thái UPLOADED; bạn vẫn Submit và reviewer duyệt. Với PDF có nhiều chứng từ/nguồn, tách phần phù hợp trước khi mapping; công cụ tách cũ còn trong **Legacy Order checks**.
6. **Chạy OCR + AI đối chiếu nhiều file**: đọc các file đã đăng ký từ Drive, OCR từng file với SHA/page riêng, xếp một lượt AI chạy nền. Không cần chọn lại file local. Tổng text tối đa theo AI_MAX_INPUT_CHARS (mặc định 200.000); PDF tối đa 300 trang/file. Nếu vượt, hệ thống chặn toàn bộ lượt với thông báo; không bỏ bớt PDF mà vẫn báo đã kiểm tra đủ.
7. **Refresh results from Drive** để lấy trạng thái/kết quả. Có overview đầu dòng, danh sách PDF/trang, 8 focus và dẫn chứng original file/page/excerpt. File đã upload, mapped task và approved là các trạng thái khác nhau. Source/material/GEO/chứng từ thay đổi sẽ đánh dấu STALE; cần review mới.
8. Luồng ChatGPT thủ công tùy chọn: tạo prompt theo nguồn và file đã chọn, attach đúng các PDF đó cho ChatGPT, lưu JSON vào folder kết quả đúng tên `<review_id>_MATERIAL_REVIEW.json`, rồi Refresh results from Drive. Không cần import JSON trở lại web. Citation thủ công phải được người dùng đối chiếu file gốc; auto-AI citation được kiểm tra với OCR trang tương ứng.
9. Chỉ sau khi bạn xác nhận owner/due/actions, hệ thống mới tạo follow-up task và đồng bộ vào Calendar KODA hiện có. Task follow-up là optional, không tự làm chứng từ APPROVED. Quota/tokens được ghi nhận; lỗi/UNKNOWN không tự gọi LLM trả phí lần nữa.

## Remove / Archive

Remove mở bản preview dependencies và yêu cầu lý do/xác nhận. Material nhập nhầm chỉ có metadata SO và task tự tạo MISSING chưa gán/chưa hoạt động có thể Remove. Có chứng từ, GEO, nguồn/quan hệ, assignment hoặc lịch sử thì chuyển Archive, giữ ID/file/history, ngừng tính progress và ngừng follow-up Calendar. Folder không bị xóa. Preview cũ không được áp dụng nếu dependencies đã thay đổi.

## Lỗi thường gặp

| Mã/triệu chứng | Xử lý |
|---|---|
| MIGRATION_REQUIRED | Chạy previewV27Migration rồi applyV27Migration trên project/Sheet hiện tại. |
| AUTH_REQUIRED · Invalid signature | So khớp BRIDGE_SECRET phía Netlify và Apps Script, deployment URL/version và Firebase provisioning. v2.7 không tự đổi secret/identity. Không đưa giá trị secret vào public code/log. |
| UNKNOWN_ACTION, 400 | Thường là bridge/frontend khác phiên bản hoặc input sai. Deploy Apps Script và Netlify functions cùng gói; đọc error.code/message/requestId. |
| DRIVE_PERMISSION_DENIED, 403 | Kiểm tra quyền tài khoản deploy với folder nguồn, Drive API và file/session, không sửa CORS bằng no-cors. |
| UPLOAD_EXPIRED / UPLOAD_OFFSET_CONFLICT | Chọn đúng PDF/SHA để Resume; nếu expired, tạo upload session mới. |
| AI_CONFIG_REQUIRED / AI_WORKER_REQUIRED | Cấu hình Script Properties và installAIWorker; Netlify env Firebase không thay thế Gemini config. |
| AI_INPUT_TOO_LARGE / AI_DAILY_LIMIT | Giảm nhóm file hoặc Admin điều chỉnh limit phù hợp; không retry trả phí vô hạn. |
| UNKNOWN / AI_EXECUTION_UNCERTAIN | Worker bị ngắt; kiểm tra execution và kết quả Drive trước khi chủ động tạo lượt khác. |
| 504 | Upload được chia 1 MiB; LLM chạy nền. Sheet/Drive vẫn có thể chậm hoặc hết quota; đọc requestId, không khẳng định mọi 504 đã biến mất. |
| CSP inline script/style | Gói tiếp tục dùng module/CSS cùng origin, canvas PDF preview; giữ CSP hiện tại. Không thêm unsafe-inline/srcdoc. |

## Giới hạn và xác minh

Đã qua 216 kiểm thử Node và 7 kiểm thử Python/PDF; kiểm tra syntax JS và runtime Apps Script. Các API Google/Calendar/Gemini/Netlify mới dùng fixture/mocks để kiểm tra protocol, ACL, checksum, state transitions và không tự duyệt/retry. Chưa kiểm thử có phí bằng key production, chưa chạy migration vào Sheet thật, chưa kiểm thử trực quan trên tài khoản browser production. Các giới hạn/quyền triển khai thật cần kiểm tra theo acceptance checklist.

Đây là hỗ trợ thu thập/chứng minh/review EUDR. Việc loại NON_WOOD khỏi workspace gỗ không phải một kết luận pháp lý OUT_OF_SCOPE cho mọi commodity. AI/OCR không tự xác minh quyền khai thác, biên giới địa lý, ảnh vệ tinh/deforestation hay nộp DDS. Baseline pháp lý và country risk vẫn cần reviewer được ủy quyền.
