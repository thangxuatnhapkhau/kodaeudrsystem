# KODA EUDR Workspace v2.6.0 — OCR, LLM và Smart Import

Đây là gói source đầy đủ, đã kiểm thử cục bộ. Chưa deploy vào website live và chưa bật API tính phí cho tài khoản của bạn.
Gói bao gồm các thay đổi v2.4.13, v2.4.16 và v2.5.0 trước đó. Cài bản này vào đúng repository hiện tại; không cài chồng các ZIP cũ sau đó.

**Bản nguồn đã xác nhận của bạn là v2.4.11-staging-candidate** trong thư mục Drive `1Oor5NGURZRo41wfXpBWDKTlHQC_mcJRY`, dựa trên `package.json`, `INSTALL_2.4.11_FULL.txt` và schema trong `Code.gs`/`Migration.gs`. Đọc **START_HERE_V2411_TO_V260.txt** để nâng trực tiếp từ bản này. Không cần cài từng ZIP trung gian. Đã mô phỏng ba migration trên schema của đúng bản nguồn: header tương thích, preview không ghi, business rows giữ nguyên và chạy lại không đổi. Chưa chạy migration trên workbook thật.

## Các tính năng đã thêm

| Luồng | Thao tác trên web | Cần API AI |
|---|---|---|
| OCR tiếng Việt/Anh | Đọc text PDF; OCR các trang scan trong browser | Không |
| Trích layout KODA | Nhập Order No., chọn PDF, Trích theo layout KODA | Không |
| Trích SO/PO bằng LLM | Chọn PDF, Trích SO/PO bằng AI; nhận preview trên web | Có, Gemini API |
| Import Excel | Tải template, điền dữ liệu, đọc và xem preview | Không |
| Kiểm tra bộ chứng từ | Dossier Check → Run OCR + AI on web → xem phần thiếu và hành động | Có, Gemini API |

- Giữ nguyên New Order/nhập tay, bốn block chứng từ, quyền Admin, lịch task và quy trình duyệt.
- SKU lấy từ PO# trong từng block S/No của SO KODA; Product ở dòng thứ hai; materials từ các dòng tiếp theo. Bộ trích layout dùng các nhãn vật liệu nhận dạng được, giữ bản mô tả gốc để user kiểm tra. LLM dùng cho layout khác hoặc phức tạp.
- Product được nhận diện theo block S/No, SKU và tên product. Các product khác nhau cùng PO# vẫn được giữ, không tự gộp quantity.
- Quantity lặp giữa các dòng material trong template chỉ được tính một lần cho product.
- Không ghi đè quantity/UOM của product hiện có. Dữ liệu mâu thuẫn phải sửa riêng và preview lại.
- Không suy đoán Scientific Name. API extraction bị chặn nếu tên khoa học do AI trả về không có trong OCR nguồn; user có thể đối chiếu file gốc và nhập tay/Excel khi OCR chưa đọc được.
- Có màn hình sửa dữ liệu, Validate preview và xác nhận trước khi lưu. Preview đã Validate được lưu để mở lại.
- Order nhập mới ban đầu là IMPORT_DRAFT. Khi xác nhận preview mới tạo/link product và material. Import bằng Excel chưa có SO PDF thì task Sales order vẫn MISSING.
- PDF gốc tối đa 100 MB; luồng upload/resume của v2.5 được giữ. PDF nguồn và OCR JSON được lưu theo Order.
- LLM chạy trong worker Apps Script theo lịch một phút; web gửi job và theo dõi trạng thái. Có thể đóng cửa sổ và mở lại lượt chạy tại Order.
- Kết quả Dossier từ API được tự nhập vào review queue trên web; không cần copy prompt sang ChatGPT cho luồng này. Luồng prompt thủ công v2.5 vẫn có thể dùng.
- Kết quả AI trên OCR chỉ ghi PARTIAL/UNREADABLE; yêu cầu kiểm tra bản gốc, nguồn gốc, plots/deforestation và legal baseline. Không tự APPROVED, chứng nhận EUDR hoặc nộp DDS.

## Cài đặt

1. Sao lưu workbook, source Apps Script và commit GitHub đang chạy. Giữ nguyên dữ liệu, folder ID, Calendar ID và Script Properties.
2. Copy các thư mục `apps_script`, `public`, `netlify`, `tests`, `tools` và các file `package.json`, `package-lock.json`, `netlify.toml` từ gói này vào đúng đường dẫn repository hiện tại. Không bỏ các assets OCR trong `public/vendor/ocr`, thư viện Excel hoặc template.
3. Trong dự án Apps Script hiện tại, thay nội dung các `.gs` tương ứng, thêm **DossierService.gs**, **SmartImportService.gs**, **AIService.gs** nếu chưa có. Dùng manifest `apps_script/appsscript.json` trong gói. Manifest thêm quyền quản lý trigger của chính dự án; không thêm quyền email gửi ra ngoài.
4. Nếu chưa có migration v2.4.14/v2.4.16, chạy `migrateV2414(true)`, kiểm tra rồi `migrateV2414(false)` từ editor bằng deploying account đang là ADMIN active.
5. Nếu chưa có hai tab `25_DOSSIER_UPLOADS`, `26_DOSSIER_CHECKS` (chưa cài v2.5), chạy `migrateV25(true)`, xem kế hoạch rồi `migrateV25(false)`. Nếu đã cài v2.5 và hai tab này đã tồn tại, bỏ qua bước này.
6. Chạy `migrateV26(true)`, xem kế hoạch rồi `migrateV26(false)`. Kế hoạch chỉ:
   - Thêm `import_line_no`, `import_source_document_id` vào cuối `24_SO_PRODUCTS`.
   - Thêm `upload_kind` vào cuối `25_DOSSIER_UPLOADS`.
   - Tạo `27_IMPORT_PREVIEWS`, `28_AI_JOBS`.
   Hàm kiểm tra prefix header trước khi ghi, không sửa business rows hiện có. Có thể chạy lại migration đã hoàn tất.
7. Giữ Google Drive API enabled trên Cloud project của Apps Script. Deploying account phải có quyền trên workbook và các folder Order; upload dùng OAuth của account này, không dùng Firebase service account sở hữu file My Drive. Advanced Calendar API vẫn cần cho lịch task.
8. Cấu hình API tại Script Properties như bảng dưới. Không đưa API key vào frontend, GitHub, workbook hoặc gửi lại trong chat.
9. Chạy **installAIWorker()** từ Apps Script editor bằng deploying Admin, cấp quyền nếu Google yêu cầu. Hàm tạo một time-driven trigger gọi **processAIJobs** mỗi phút và không tạo thêm trigger trùng cho cùng account. Chỉ một account deploying nên cài worker.
10. Deploy **phiên bản Web App Apps Script mới**, Execute as me. Nếu dùng cùng deployment thì giữ URL; nếu URL đổi, cập nhật APPS_SCRIPT_WEBAPP_URL tại Netlify.
11. Commit/push source lên GitHub để Netlify deploy `public` và `netlify/functions`. Refresh và xác nhận footer **STAGING 2.6.0**. Không chỉ thay app.js.
12. Chạy acceptance bằng file thật ở mục dưới trước khi cho team dùng production.

## Script Properties cho AI

| Key | Giá trị | Ý nghĩa |
|---|---|---|
| GEMINI_API_KEY | API key từ project Gemini API được KODA cho phép | Chỉ lưu server-side |
| AI_ENABLED | true | Bật gọi API; false để dừng |
| AI_MODEL | gemini-3.8-flash | Model mặc định theo tài liệu Google được kiểm tra 12/10/2026; có thể thay bằng model ID hỗ trợ JSON schema và project của bạn được dùng |
| AI_MAX_JOBS_PER_DAY | 20 | Giới hạn tổng job/ngày UTC; tối đa cấu hình 200 |
| AI_MAX_USER_JOBS_PER_DAY | 5 | Giới hạn mỗi user/ngày UTC; tối đa 100 |
| AI_MAX_INPUT_CHARS | 200000 | Giới hạn text gửi LLM; tối đa 700000 |
| AI_MAX_OUTPUT_TOKENS | 16384 | Chặn output quá dài; tối đa 32000 |

Các giá trị limit có mặc định trên nếu để trống. GEMINI_API_KEY và AI_ENABLED phải cấu hình thì nút AI mới chạy. Worker phải được cài.
Không dùng FIREBASE_WEB_API_KEY làm Gemini API key; hai key phục vụ hai mục đích khác nhau.
Giữ DB_ID, ROOT_ID, CALENDAR_ID, BRIDGE_SECRET và ALLOWED_ORIGINS đang dùng. Netlify không cần nhận thêm Gemini key; key chỉ ở Apps Script.

### Phí và dữ liệu

OCR Tesseract, đọc layout KODA và Excel chạy cục bộ, không gọi dịch vụ AI tính phí. LLM sử dụng Gemini API, có quota/billing riêng theo project; gói thuê bao ChatGPT Business/Gemini Pro không tự đăng nhập thay cho API key trong ứng dụng này. Chọn project/tier được KODA chấp thuận cho dữ liệu SO/PO và supplier, kiểm tra điều khoản dữ liệu và billing. Hosting, Drive và Apps Script vẫn theo quota/gói hiện có.
Source chưa tạo project Cloud Run/Document AI hoặc bật billing cho bạn. Chỉ khi Admin cấu hình key, bật AI_ENABLED và user bấm chạy thì worker mới gọi Gemini.
Hệ thống ghi nhận job, model, token usage và lỗi; không tự gửi lại request LLM sau lỗi rate limit, provider error, output bị cắt hoặc execution không rõ. Giới hạn lượt là kiểm soát ứng dụng, không thay thế budget/billing của Google.

Private key Firebase/BRIDGE_SECRET từng được gửi trong hội thoại trước đó cần được thay trước production. Gói không chứa các giá trị đó. Không khôi phục khóa đã lộ khi rollback.

## Cách dùng

### Nhập Order mới từ SO/PO

Orders → Import SO/PO/Excel → nhập Order No. → chọn PDF → Trích theo layout KODA hoặc Trích SO/PO bằng AI → sửa preview → Validate preview → tick xác nhận đối chiếu → Xác nhận và lưu vào Order.
Nếu có folder tương ứng trong Drive, chọn đúng folder khi web yêu cầu. Nếu Order đã tồn tại, mở Order đó và dùng Import; không tạo Order thứ hai cùng số.

Khi SO PDF được upload qua Smart Import, bản gốc được đăng ký SO_IMPORT. Sau khi user xác nhận một Order draft có nguồn SO_IMPORT, source chuyển thành SO/SUBMITTED và task Sales order chờ review. File gốc vẫn ở folder của Order. Các material chưa được đánh giá scope/legality chỉ là metadata, không phải chứng từ đã approved.

### MP nhập thêm material từ Excel

Mở Order → Import SO/PO/Excel → tải **KODA_Order_Import_Template.xlsx** → điền sheet Order_Import → Đọc Excel → kiểm tra → Validate → xác nhận lưu.
MP dùng SKU/product hiện có và quantity/UOM đúng hiện tại. Marketing/Admin tạo product mới. Các quyền xem SO PDF vẫn giữ giới hạn Admin/Marketing; MP không được mở SO_IMPORT để vượt quyền.
Template chỉ nhận giá trị, không nhận công thức hoặc dòng ẩn. Không đổi tên/thứ tự cột.

### Kiểm tra EUDR trực tiếp trên web

Mở Order → Open Dossier Check → upload bộ PDF gốc nếu chưa có → Run OCR + AI on web → chọn lại đúng file gốc từ computer → Chạy OCR + AI kiểm tra.
OCR trước hết đọc text layer; trang ít text sẽ chạy OCR eng+vie. Tick OCR lại toàn bộ trang nếu text layer sai hoặc bỏ sót.
Web gửi job, worker xử lý và kết quả tự về review queue. Chọn Mở kết quả Dossier Check để xem missing/mismatch/action và ranh giới chứng từ. Việc tách PDF/gắn task/Submit/review vẫn dùng luồng v2.5 và cần user xác nhận.
Có thể đóng cửa sổ trong khi LLM đang chạy. Mở lại Dossier Check → Run OCR + AI on web → Lần chạy gần đây → Xem kết quả.
Đóng cửa sổ khi OCR đang chạy sẽ dừng OCR; không có job LLM mới nếu chưa gửi queue. Giữ cửa sổ mở để OCR hết bộ PDF.

## Giới hạn vận hành

- PDF gốc: 100.000.000 bytes/file. OCR tối đa 300 trang, 60.000 ký tự mỗi trang, và text toàn bộ phải trong limit trên server. Không âm thầm bỏ trang; bộ vượt giới hạn cần tách thành bộ nhỏ hơn.
- Excel: .xlsx, tối đa 10 MB, 1.000 dòng, 100 product blocks. Một file import một Order.
- Preview/result: tối đa 48 KB UTF-8. Import nhiều product theo nhóm nhỏ nếu vượt giới hạn.
- OCR có thể sai với scan mờ, chữ viết tay, bảng phức tạp, xoay lệch, font lỗi hoặc ngôn ngữ ngoài eng/vie. Layout KODA parser chỉ nhận dạng các cấu trúc/nhãn đã hỗ trợ; LLM hoặc nhập tay/Excel dùng khi chưa nhận dạng được.
- PDF mã hóa hoặc hỏng có thể không đọc được. Không bảo đảm trích xuất chính xác mọi layout.
- Browser cần tải bộ OCR self-hosted lần đầu; bundle lớn hơn v2.5. Không dùng CDN bên ngoài để chạy OCR. Giữ nguyên CSP: script self/wasm, worker self và các host connect hiện có.
- Worker khoảng một phút theo trigger, thời gian chờ còn phụ thuộc số job, API và quota Apps Script. Một execution xử lý một job. Trạng thái RUNNING quá 10 phút được ghi UNKNOWN để tránh gọi lại AI tự động.
- Chưa có live legal lookup, satellite analysis hoặc xác minh forest origin tự động. API review dựa trên OCR/text và Order context; không được coi là full visual/legal verification.
- ZIP Export vẫn giới hạn 23 MiB source files/package theo engine cũ. Upload/đọc nguồn 100 MB không nâng giới hạn ZIP này.
- Bản nâng cấp không tự chia sẻ Sheet/Drive/Calendar với audience mới.

## Acceptance sau deploy

1. Admin vẫn tạo New Order thủ công; bốn block, quyền xem SO, Remove controls và Calendar invitation vẫn đúng.
2. Trích một SO KODA thật: kiểm tra SKU theo PO# của từng S/No, Product, quantity và nhiều material. Thử SKU có số 0 đầu và hai product cùng PO# ở các block khác nhau.
3. Import template với hai material cùng product; quantity không bị cộng hai lần. Sai Order, formula, dòng ẩn, qty mâu thuẫn phải bị chặn. MP không được tạo product mới hoặc đọc SO_IMPORT.
4. Upload SO/PDF lớn hơn 3 MB; ngắt mạng và chọn lại file để resume. Kiểm tra đúng folder, SHA và đăng ký một bản gốc.
5. Chạy OCR trên scan Việt/Anh; kiểm tra text theo từng trang. Thử Force OCR khi text layer sai.
6. Chạy một job Gemini thật trên project đã cấu hình: worker phải DONE, usage được lưu, preview trở về web, không tự tạo product/material trước khi user xác nhận.
7. Chạy Dossier API; findings phải về review queue, summary/action dễ đọc, coverage PARTIAL/UNREADABLE và không có tự APPROVED.
8. Đổi Order sau khi tạo preview/queue; kết quả cũ bị chặn. Thử user khác truy cập job/preview, user disabled, API key sai và daily limit.
9. Đóng rồi mở lại job/preview. Giữ source/reference nguyên vẹn. Review các PDF đã tách so với trang gốc.

Validation đã thực hiện: **178/178 automated tests PASS**, syntax checks, protocol/worker mocks, local parser, Excel file thật trong tests, quyền, stale data, resume, partial import recovery và UI DOM. OCR Tesseract eng+vie đã chạy thật trên ảnh mẫu (confidence 95, giữ SKU có số 0 đầu). Template đã render và kiểm tra layout.
Chưa chạy browser signed-in trên Netlify hoặc request Gemini thật vì phiên này chưa có API key và quyền ghi/deploy GitHub/Apps Script/Netlify. Model availability, API billing/quota, OAuth, CSP/worker, CORS, assets và trigger cần acceptance trên môi trường thật.

## Tài liệu chính thức đã kiểm tra 12/10/2026

- Gemini models: https://ai.google.dev/gemini-api/docs/models
- Structured output: https://ai.google.dev/gemini-api/docs/structured-output
- REST generateContent: https://ai.google.dev/api/generate-content
- Billing: https://ai.google.dev/gemini-api/docs/billing
- Apps Script installable triggers: https://developers.google.com/apps-script/guides/triggers/installable
- Tesseract self-hosting: https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md
- EC EUDR: https://environment.ec.europa.eu/topics/forests/deforestation/regulation-deforestation-free-products_en

## Rollback

Đặt AI_ENABLED=false để dừng gọi API. Nếu cần rollback source, dùng commit/Web App đã sao lưu; giữ các tab 25–28, cột bổ sung và folder AI_Work/AI_Dossier để bảo toàn lịch sử. Không xóa Order/chứng từ hoặc coi job RUNNING/UNKNOWN là đã xử lý thành công. Nếu source cũ không có processAIJobs thì remove trigger tương ứng từ Apps Script editor để tránh lỗi trigger.
