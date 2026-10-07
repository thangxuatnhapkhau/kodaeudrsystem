# KODA EUDR System — báo cáo triển khai staging và nghiệm thu v2.3

**Ngày kiểm tra:** 07/10/2026 (UTC)  
**Phạm vi:** mã nguồn staging từ gói v2.2 được cung cấp, Google Sheet `EUDR SYSTEM` và một phần cấu trúc Drive đang dùng (chỉ đọc).  
**Kết luận phát hành:** **CHƯA TRIỂN KHAI / CHƯA ĐẠT NGHIỆM THU PRODUCTION.** Các trạng thái `SUPPORTED` dưới đây mô tả mã nguồn staging và kiểm thử tổng hợp, không xác nhận hành vi của Netlify, Apps Script, Firebase hoặc Drive ACL đang chạy. Không ghi hay di chuyển hàng dữ liệu production, tệp Drive hoặc quyền chia sẻ trong phiên này.

## A. Kiểm kê hệ thống hiện hữu

- Kiến trúc quan sát được: Netlify frontend và function xác thực Firebase, HMAC bridge tới Apps Script; Sheets lưu bản ghi; Drive lưu SO, chứng từ và bản dẫn xuất; Calendar đồng bộ hạn task. Mã trong Drive và gói v2.2 là bản tham chiếu; **chưa xác minh commit/build của production**.
- Workbook có **24 tab**. Số bản ghi có ID (không tính header) tại thời điểm đọc: `01_SO_MASTER` 2; `24_SO_PRODUCTS` 2; `02_SO_ITEM_MATERIAL` 3; `03_EVIDENCE_REQUIREMENT` 10; `04_EVIDENCE_TRACKER` 29; `05_OWNER_MASTER` 4; `06_DOCUMENT_REGISTER` 12; `08_ACTIVITY_LOG` 88; `18_AI_PROMPT_RUNS` 11. `14_SUPPLIERS`, `15_SUPPLY_CHAIN`, `17_GEO_LOCATIONS` chưa có hàng dữ liệu. Đây là snapshot, không phải kết quả migration.
- Folder Order được xem giữ `00_SO`, hai folder vật liệu, `90_Processed`, `98_Export`, `99_Archive`. Các ID folder/file đã có được giữ nguyên.
- Một hàng sản phẩm của `SO26-0610` là chuỗi nhiều tên sản phẩm gộp trong **một** hàng legacy, thiếu quantity. Cần đối chiếu SO gốc trước khi tách; không tự tạo ba sản phẩm giả định.
- Metadata chia sẻ cho workbook, folder mã nguồn và evidence root trả về `anyone: writer`. Quyền API không bảo vệ được tệp truy cập trực tiếp bằng Drive ACL này. Chưa xác minh ACL kế thừa của từng SO; chưa thay đổi quyền.
- Mã staging v2.2 có các cơ chế ID ổn định, sản phẩm nhiều dòng, MP nhập vật liệu, chain dạng cây, chứng từ có phiên bản, prompt AI, GEO và migration. Những xung đột với yêu cầu mới là Admin thiếu quyền mặc định, chunk upload cho phép tới 25 MiB, bốn block chứng từ bị mất cách trình bày cũ, cảnh báo tổng hợp xuất hiện sớm, và thiếu override theo Order/Tier.

## B. Gap analysis theo từng mục của master prompt

**Quy ước:** `SUPPORTED` = có trong **bản staging v2.3** và đã được kiểm tra ở phạm vi thích hợp; `PARTIALLY_SUPPORTED` = còn điều kiện dữ liệu, triển khai hoặc UAT; `NOT_SUPPORTED` = chưa có tính năng; `BUG` = lỗi trong hệ đang dùng/chưa xác nhận đã phát hành bản sửa; `SCHEMA_CHANGE_REQUIRED` = cần migration trước khi bật mã. Mục 4 không tồn tại trong văn bản nguồn.

| Mục | Trạng thái | Kết quả / phần còn thiếu |
|---:|---|---|
| 1 Vai trò thực hiện | PARTIALLY_SUPPORTED | Đã sửa mã và kiểm thử cục bộ; không có quyền phát hành production. |
| 2 Mục tiêu nghiệp vụ | PARTIALLY_SUPPORTED | Mô hình Order→Products→Materials→Chain→Evidence có trong staging; dữ liệu nguồn và UAT sống thiếu. |
| 3 Nguồn dữ liệu | PARTIALLY_SUPPORTED | Đã kiểm kê Sheet/Drive, nhưng build Netlify, Apps Script và Firebase production chưa xác minh. |
| 5 ID ổn định | SUPPORTED | ID Order/Product/Material/Node/Task/Document; product IDs trên material. |
| 6 Sửa Order | SUPPORTED | Sửa display metadata, quantity sản phẩm; ID và liên kết không đổi; audit. |
| 7 Nhiều Product | SUPPORTED | Một SO PDF, nhiều sản phẩm/quantity; kiểm thử retry. |
| 8 Ảnh Product | PARTIALLY_SUPPORTED | Liên kết Drive file theo product và preview bên phải; chưa kiểm tra ảnh thật trên production. |
| 9 Tệp <3 MB | SUPPORTED | Client/server/chunk/derived từ chối `>=3,000,000` bytes; tải xuống lịch sử 25 MiB là đường riêng. |
| 10 Quyền SO PDF | PARTIALLY_SUPPORTED | Direct API, bootstrap, chunk và export kiểm tra `SO_VIEW` trong staging; Drive ACL công khai còn chặn xác nhận bảo mật. |
| 11 Bỏ AI trích vật liệu SO | SUPPORTED | UI/API của tính năng cũ bị vô hiệu hóa; MP nhập vật liệu. |
| 12 MP nhập Material | SUPPORTED | Nhập thủ công/JSON preview, PO tùy chọn, cập nhật không nhân đôi. |
| 13 Folder Material | PARTIALLY_SUPPORTED | Tạo theo ID và retry; chưa xác nhận folder production mới. |
| 14 Chain biến thiên | SUPPORTED | Parent graph nhiều tầng, bổ sung dần, cycle/scope validation. |
| 15 Supplier Master | SUPPORTED | Reuse và kiểm tra trùng chính xác; bảng production hiện trống. |
| 16 UX Chain | PARTIALLY_SUPPORTED | Cây và chọn parent/supplier trong staging; chưa visual UAT. |
| 17 Folder Chain | PARTIALLY_SUPPORTED | Folder quan hệ theo ID; chưa test Drive thật và ACL. |
| 18 Requirement theo Order/Tier | SCHEMA_CHANGE_REQUIRED | v2.3 có add/REQUIRED/OPTIONAL/NOT_REQUIRED theo task, lý do và audit; phải chạy `migrateV23`. |
| 19 Quyền Purchasing/Sourcing | SUPPORTED | Tạo chain, upload/draft/submit; API từ chối phê duyệt và policy. |
| 20 Vòng đời file | PARTIALLY_SUPPORTED | Version, submit, review, supersede có test; chưa thử tệp thật/Drive live. |
| 21 Marketing + Reviewer | PARTIALLY_SUPPORTED | Marketing có review/policy/SO/AI; Reviewer legacy giữ quyền review trong giai đoạn chuyển tiếp, chưa di trú người dùng thật. |
| 22 Admin | SUPPORTED | Backend cấp toàn bộ capability không cần grant từng người; UI hiện New Order; test API. |
| 23 Bố cục Workspace | PARTIALLY_SUPPORTED | Giữ summary, Products/Materials cùng vùng dữ liệu, ảnh bên phải; chưa visual browser QA. |
| 24 Màu/trạng thái | SUPPORTED | Red/green/blue/yellow và rejected/not-required/overdue kèm chữ/biểu tượng. |
| 25 Bốn block chứng từ | SUPPORTED | Bốn block đúng thứ tự, task theo tier bên trong; override riêng. |
| 26 SO lịch sử khó duyệt | PARTIALLY_SUPPORTED | Repair task liên kết file cũ, không tự duyệt/nhân đôi; dữ liệu live chưa reconciled. |
| 27 Kiểm tra hoàn tất cuối | SUPPORTED | API checklist read-only chỉ được gọi khi mở bước cuối; closure server kiểm tra lại. |
| 28 Traceability | PARTIALLY_SUPPORTED | Trường loài, nước, lượng, thời gian, nguồn; phần lớn live data chưa có. |
| 29 GEO cuối chuỗi | PARTIALLY_SUPPORTED | Plot/nguồn/review theo terminal; hình học phức tạp và plot live chưa xác nhận. |
| 30 Thiết kế pháp lý/rủi ro | PARTIALLY_SUPPORTED | Config phiên bản và bảng risk có provenance; chưa có risk row/human approval live. |
| 31 Baseline EUDR hiện hành | PARTIALLY_SUPPORTED | Đã đối chiếu trang EC ngày 07/10/2026; cần chuyên trách pháp lý xác nhận văn bản đầy đủ/Annex. |
| 32 Business rule vs EUDR | SUPPORTED | Readiness và closure chỉ là nội bộ; không tự tuyên bố tuân thủ. |
| 33 Kiến trúc AI | PARTIALLY_SUPPORTED | Prompt/run/import/result có nguồn và human review; không có AI worker tự chạy trong cloud. |
| 34 AI Document Review | PARTIALLY_SUPPORTED | Prompt/order scope và structured findings; OCR/AI thực tế chưa chạy end-to-end. |
| 35 Kiểm tra thời gian | PARTIALLY_SUPPORTED | So sánh ngày xác định được; chất lượng trích xuất từ tệp cần người xác nhận. |
| 36 Đầu ra Review | SUPPORTED | Findings có source ID/page/excerpt, trạng thái và quyết định người duyệt. |
| 37 Che giá PDF | PARTIALLY_SUPPORTED | Worker offline + 7 test PDF; chưa kiểm tra tài liệu thật/triển khai worker. |
| 38 Phụ đề Anh PDF | PARTIALLY_SUPPORTED | Worker offline và test không cắt trang; bản dịch vẫn do người cung cấp/kiểm tra. |
| 39 Quản lý AI output | PARTIALLY_SUPPORTED | Lineage, SHA-256, phiên bản, xác minh riêng; chưa UAT trên file thật. |
| 40 Audit | PARTIALLY_SUPPORTED | Critical actions mới ghi actor/time/ID; cần đối soát live và log ngoài Apps Script. |
| 41 Toàn vẹn dữ liệu | PARTIALLY_SUPPORTED | ID, scope, lock, expected version, idempotency; chưa kiểm tra concurrency live. |
| 42 RBAC UI + API | PARTIALLY_SUPPORTED | Backend test qua; ACL Drive `anyone: writer` là đường vòng trực tiếp. |
| 43 Hardening | PARTIALLY_SUPPORTED | Không thêm secret, route allowlist và HMAC; cần xử lý ACL và rà soát deployment. |
| 44 Thiết kế Sheets | SUPPORTED | Tái dùng 24 tab, v2.3 chỉ thêm 4 cột vào tracker, header-based access. |
| 45 Migration | PARTIALLY_SUPPORTED | Dry-run/code idempotent; chưa backup/migrate/reconcile live. |
| 46 UX | PARTIALLY_SUPPORTED | DOM EN/VI qua; visual QA desktop/tablet/mobile chưa chạy được. |
| 47 Xử lý lỗi | PARTIALLY_SUPPORTED | Size/conflict/scope có mã lỗi; thử lỗi kết nối live còn thiếu. |
| 48 Đa người dùng | PARTIALLY_SUPPORTED | Lock, request key, optimistic update; chưa load/UAT nhiều phiên thật. |
| 49 Lưu giữ/provenance | PARTIALLY_SUPPORTED | Lưu bản gốc, supersession, dẫn xuất; retention policy Drive chưa xác nhận. |
| 50 Evidence ≠ chứng nhận | SUPPORTED | UI và workflow yêu cầu người chịu trách nhiệm, không auto compliance. |
| 51 A–O | PARTIALLY_SUPPORTED | Kiểm thử tổng hợp bên dưới; tất cả acceptance production đang BLOCKED. |
| 52 Regression | PARTIALLY_SUPPORTED | 6 nhóm JS + 7 PDF qua; Calendar/Drive/auth/bridge live chưa chạy. |
| 53 Thứ tự thực hiện | PARTIALLY_SUPPORTED | Audit→schema→backend→UI→test; bước migrate/deploy production chưa làm. |
| 54 A–L đầu ra | PARTIALLY_SUPPORTED | Báo cáo này và mã staging; deployment/result live chưa có. |
| 55 Thiếu dữ liệu | SUPPORTED | Không tự suy loài, GEO, country, sản phẩm legacy; chặn closure. |
| 56 Change control | PARTIALLY_SUPPORTED | Không ghi production; còn thiếu gate phát hành và rollback đã kiểm chứng. |
| 57 Trách nhiệm con người | SUPPORTED | Review/override/closure có actor và ghi chú bắt buộc. |
| 58 Quality bar | PARTIALLY_SUPPORTED | Mô hình trả lời được khi dữ liệu đủ; hiện thiếu chain/GEO/nguồn nên chưa hoàn tất hồ sơ thật. |

## C. Mô hình dữ liệu và thay đổi Sheet chính xác

| Tab / entity | Khóa và quan hệ | Cách dùng ở v2.3 |
|---|---|---|
| `01_SO_MASTER` | `id` bất biến | SO No. là display, `so_document_id` và `folder` giữ liên kết. |
| `24_SO_PRODUCTS` | `id`; `case_id → Order` | N sản phẩm, quantity/UOM, `image_document_id`, active/sequence. Đã tồn tại trên workbook live. |
| `02_SO_ITEM_MATERIAL` | `id`; `case_id`; `product_ids` JSON mảng ID | Một vật liệu có thể áp dụng cho nhiều Product; PO tùy chọn. |
| `14_SUPPLIERS` | `id` | Master tái sử dụng, địa chỉ không suy thành nước sản xuất. |
| `15_SUPPLY_CHAIN` | `id`, `material_id`, `parent_id`, `supplier_id`, `folder` | Cây biến thiên; producer/forest owner có thể không có commercial supplier ID. |
| `03_EVIDENCE_REQUIREMENT` | `id`, `policy_id`, version | Quy định mặc định có version, không bị sửa/xóa khi override một Order. |
| `04_EVIDENCE_TRACKER` | `id`, `case_id`, `material_id`, `chain_node_id`, `requirement_id`, `document_id` | Task hiện hữu nhận override riêng. **v2.3 thêm đúng 4 cột cuối:** `override_state`, `override_reason`, `override_by`, `override_at`. `required=YES` khi REQUIRED, `NO` khi OPTIONAL/NOT_REQUIRED; `override_state` giữ khác biệt. |
| `06_DOCUMENT_REGISTER` | `id`, `task_id`, `product_id`, `file_id`, source/derivative IDs | File gốc, phiên bản, SHA-256, kết quả duyệt. Không đưa binary vào Sheet. |
| `17_GEO_LOCATIONS` | `id`, `chain_node_id`, `material_id`, `source_document_id` | Plot geometry và human review. |
| `18_AI_PROMPT_RUNS`, `07_AI_REVIEW_QUEUE`, `08_ACTIVITY_LOG` | Stable IDs và source references | Prompt/results, findings, quyết định, audit. |

`migrateV23(true)` đối chiếu prefix header v2.2, trả plan và không ghi. `migrateV23(false)` chỉ thêm bốn header nếu thiếu, không thay đổi business row; gọi lần hai trả `columns: 0`. Nếu header khác hoặc thiếu schema v2.2, abort trước khi ghi. Bản `release/SCHEMA_V23.json` là schema mã nguồn, **không phải dump dữ liệu live**.

## D. Ma trận quyền mặc định trong mã staging

Mọi quyền còn phải qua scope Order/Task và xác thực user; quyền bổ sung cho vai trò nội bộ do Admin cấp và audit. Drive sharing phải xử lý riêng.

| Thao tác | Admin | Marketing | MP | Purchasing/Sourcing | Reviewer legacy | Supplier user | Viewer |
|---|---|---|---|---|---|---|---|
| Tạo/sửa Order, Product | Có | Có | Không mặc định | Không mặc định | Không mặc định | Không | Không |
| Đọc SO PDF qua API | Có | Có | Không | Không | Không mặc định | Không | Không |
| Material/PO | Có | Không mặc định | Có | Không mặc định | Không mặc định | Không | Không |
| Supplier/Chain | Có | Không mặc định | Không | Có | Không mặc định | Không mặc định | Không |
| Upload/submit Evidence | Có | Không mặc định | Không | Có | Không mặc định | Có trong scope | Không |
| Review/approve/reject | Có | Có | Không | Không | Có trong giai đoạn chuyển tiếp | Không | Không |
| Quy định global và override Order/Tier | Có | Có | Không | Không | Có trong giai đoạn chuyển tiếp | Không | Không |
| AI review, GEO review, export/closure | Có | Có | AI use hạn chế | GEO entry, AI use | Review/AI/export hạn chế | GEO entry trong scope | Không |
| User/config | Có | Không | Không | Không | Không | Không | Không |

Vai trò `EUDR_REVIEWER` chưa bị xóa hoặc đổi hàng người dùng thật; việc chuyển sang Marketing cần danh sách tài khoản và kiểm tra scope. Admin không cần cell capability riêng.

## E. State machine và gate

- **Order:** `CREATING` (ẩn khỏi bootstrap) → `COLLECTING_EVIDENCE` → `IN_REVIEW`/`ACTION_REQUIRED` → `READY_FOR_OPERATOR_REVIEW` → `CLOSED`; người có quyền có thể `REVIEW_REQUIRED` khi reopen có lý do. Trạng thái readiness không là tuyên bố EUDR.
- **Material:** tạo từ MP không cần PO; sau đó cập nhật chính ID, gắn product IDs và metadata nguồn. Thiếu loài, xuất xứ hoặc chứng từ được giữ là thiếu; không bịa dữ liệu.
- **Chain:** thêm Tier 1, sau đó parent-linked Tier N/nhánh; `terminal=YES` chỉ với origin phù hợp, GEO và human review được kiểm tra ở bước cuối. Evidence cũ giữ nguyên.
- **Evidence:** `MISSING → UPLOADED → SUBMITTED → IN_REVIEW → APPROVED / REJECTED / MORE_INFO_REQUIRED`; draft có thể thay/gỡ và bản cũ giữ lịch sử. File đã submit không được ghi đè lặng lẽ. `NOT_REQUIRED`/`OPTIONAL` là quyết định theo task có lý do và audit, không xóa tài liệu hay global policy. SO legacy được sửa task để có trạng thái submitted/reviewable, không auto approve.
- **AI/derived:** prompt/run → import result → human review findings; PDF dẫn xuất upload với lineage/report → human verification. Closure kiểm tra source versions hiện hành, required approvals, chain/GEO, legal freshness và export, rồi yêu cầu ghi chú xác nhận người duyệt.

## F. Mô hình Drive folder

```text
EUDR root / Order [stable order id]
  00_SO/                     one original SO PDF per Order
  Material [stable material id]/
    01_Commercial_Shipping/
    02_FSC_Certification/
    03_Transport/
    04_Geolocation/
    Relationship [stable chain node id]/  evidence at that Tier
  90_Processed/              derived PDF, linked to original ID
  98_Export/                 approved package and manifest
  99_Archive/                retry chunks and retained superseded data
```

Thư mục hiện hữu giữ nguyên tên và ID; code dùng ID lưu trong Sheet. Tên hiển thị không là khóa. Việc tạo folder mới có request key/idempotency; thao tác gián đoạn giữa Drive object và marker cần kiểm tra thủ công. Không tự di chuyển file live. ACL root, folder con và file SO phải được người quản trị rà soát trước phát hành.

## G. Kế hoạch thực hiện và module

1. Kiểm kê Sheet/Drive và đối chiếu source với bản đang chạy; chụp backup/ACL/row-count trước mọi migration.
2. Chạy v2.2 migration chỉ nếu schema live thực sự thiếu và sau khi có backup; đối chiếu legacy product. Chạy v2.3 additive migration trước v2.3 backend.
3. Deploy đồng bộ `apps_script/{AuthService,OrderService,DocumentService,TransferService,WorkspaceService,Migration,Bridge}.gs`, Netlify `functions/call.mjs`, `public/{app,style,i18n,index}`; giữ cấu hình secret ở server/Script Properties.
4. UAT staging với role thật và file thật; kiểm tra direct API, Drive ACL, Calendar, AI worker, PDF, desktop/tablet/mobile EN/VI.
5. Đối soát count/ID/history, legal review và change approval; phát hành production và kiểm tra lại bằng version/commit đã ghi nhận.

## H. Mã đã sửa trong candidate

- `AuthService.gs`: Admin nhận toàn bộ capabilities; Reviewer legacy tạm giữ review; backend chặn grant vào Admin. `app.js` hiện New Order và ẩn nút cấp quyền dư thừa cho Admin.
- `DocumentService.gs`, `TransferService.gs`, `app.js`: mọi manual/derived upload dưới 3,000,000 bytes; cả session chunk cũ quá giới hạn bị chặn. Download file lịch sử có giới hạn riêng.
- `WorkspaceService.gs`, Bridge, Netlify allowlist: `getDossierReview` read-only, riêng bước cuối và kiểm tra lại lúc `completeCase`.
- `app.js`, `style.css`, `i18n.js`: summary và Product/Material chung vùng dữ liệu, ảnh bên phải; bốn block chứng từ; status dễ đọc; AI Results đứng trước nút final; cảnh báo tổng hợp chỉ trong modal final.
- `OrderService.gs`, Bridge, Netlify allowlist: `setTaskRequirement` và `addScopedRequirement` theo Order/Material/Tier, quyền `POLICY_EDIT`, lý do, optimistic version, audit và chống trùng. `Migration.gs`: bốn cột additive, dry-run/idempotency.
- `tests/{v22,v2,ui-dom}.test.mjs`: quyền, giới hạn, override, migration, thứ tự bốn block và final gate. `tests/browser-v22.mjs` được cập nhật assertion v2.3 nhưng chưa chạy được do Chromium.

## I. Migration và reconciliation

| Phạm vi | records_before | records_migrated | records_skipped | records_exception | records_after | Kết quả |
|---|---:|---:|---:|---:|---:|---|
| 2 Orders live | 2 | 0 | N/A | 0 phát sinh trong phiên | 2 tại snapshot | Không ghi live. |
| 2 Products live | 2 | 0 | N/A | **1 cần xác minh** | 2 tại snapshot | Hàng `SO26-0610` gộp nhiều tên, thiếu quantity. |
| 3 Materials live | 3 | 0 | N/A | Chưa reconciled toàn bộ | 3 tại snapshot | Không thay folder/PO. |
| 29 Evidence tasks live | 29 | 0 | N/A | Chưa reconciled toàn bộ | 29 tại snapshot | v2.3 header migration **chưa chạy** live. |
| 12 Document rows live | 12 | 0 | N/A | Chưa đối chiếu từng Drive ID | 12 tại snapshot | Không chạm file/trạng thái duyệt. |
| v2.3 synthetic migration | 2 task fixture | 0 business rows | 0 | 0 | 2 | Thêm 4 header trong mock; chạy lại thêm 0. |

Số `records_after` live ở bảng là snapshot chỉ đọc cùng thời điểm, **không phải** một lần kiểm kê sau migration. Chưa có backup production, chưa thể công bố migration hoàn tất. `24_SO_PRODUCTS` đã tồn tại trước phiên này; nguồn/thời điểm tạo tab chưa được xác minh.

## J. Kết quả QA

**Tự động cục bộ:** `npm test` 6/6 file test qua; `npm run check` qua; `npm run test:pdf` 7/7 qua. Dữ liệu là synthetic và Google services mock. Chromium installer trả archive không hợp lệ/truncated, nên `test:browser` chưa chạy. Các trạng thái bên dưới là **acceptance production**; PASS cục bộ không thay thế UAT live.

| Scenario | Production | Bằng chứng cục bộ / lý do |
|---|---|---|
| A. 3 Product, một SO | BLOCKED | Multi-product/one SO/retry có test; chưa tạo Order thật. |
| B. PO đến sau | BLOCKED | Test MP cập nhật cùng ID không thêm folder; chưa UAT thật. |
| C. 2 Material/folder | BLOCKED | Drive snapshot thấy 2 folder; chưa chạy tạo trên staging. |
| D. Tier thêm dần | BLOCKED | Graph 12 tầng, branch/cycle test; chưa thao tác nhiều tuần thật. |
| E. Terminal/GEO | BLOCKED | Rule và closure code; live Chain/GEO đều 0 hàng. |
| F. Thay file sai | BLOCKED | Draft lifecycle test; Drive thật chưa kiểm tra orphan. |
| G. Chặn thay submitted | BLOCKED | Backend test `VERSION_CONFLICT`. |
| H. Marketing duyệt | BLOCKED | Backend test Marketing/denial Purchasing. |
| I. Bảo mật SO | BLOCKED | Direct API mock test; Drive ACL `anyone: writer` không đạt. |
| J. SO lịch sử | BLOCKED | Repair task test không nhân đôi file; live rows chưa reconciled. |
| K. Override một Tier | BLOCKED | Test scoped task độc lập, quyền, lý do/audit; v2.3 migration chưa chạy live. |
| L. AI Document Review | BLOCKED | Schema/import/chronology test; chưa AI end-to-end trên nguồn thật. |
| M. Redaction | BLOCKED | PDF unit tests qua; chưa dùng tài liệu thật/OCR human check. |
| N. English Subtitle | BLOCKED | PDF unit tests qua; chưa có bản dịch/QA thật. |
| O. Audit | BLOCKED | Test action mới; chưa đối chiếu audit live xuyên hệ. |

Regression cục bộ đã bao gồm auth, SO denial, product, evidence lifecycle, migration, DOM EN/VI và PDF. Login Firebase, Calendar thật, Drive thật, Netlify→Apps Script và visual responsiveness production vẫn BLOCKED.

## K. Triển khai và kết quả

**Đã triển khai:** chỉ tạo gói **v2.3.0-staging-candidate** trong workspace. **Không có commit, Netlify build ID, Apps Script version ID hoặc production deployment để xác nhận.** Gói mã không chứa credential mới.

Trình tự cho operator có quyền sau khi xử lý ACL và tạo backup:

1. Sao lưu Sheet/Drive và ghi row counts, headers, folder/file IDs; tạo môi trường staging riêng và kiểm tra secret ở Netlify env, Apps Script Properties, Firebase. Không đưa secret vào frontend/Sheet.
2. So khớp live headers với `SCHEMA_V23.json` và `SCHEMA_V22.json`. Nếu v2.2 chưa đủ, chạy `migrateV22(true)`, kiểm tra plan rồi `migrateV22(false)` **trên backup staging trước**; nếu schema đã đủ, không backfill tùy tiện. Xác minh từng legacy product với SO gốc.
3. Chạy `migrateV23(true)`; plan phải chỉ có 4 cột tracker hoặc 0 nếu đã chạy. Sau backup và đối soát, chạy `migrateV23(false)` ở staging; kỳ vọng `records_changed: 0`, rồi chạy lại kỳ vọng `columns: 0`.
4. Deploy Apps Script version mới, cấu hình bridge URL/secret server side, deploy Netlify cùng source version; test Firebase role và action allowlist. Chạy UAT A–O, direct API, folder/file ACL, status, Calendar, AI/PDF và trình duyệt EN/VI ở ba kích thước.
5. Ghi build/commit/version, row-count/ID diff, tester/decision, thời gian phát hành và rollback point; chỉ sau đó lặp lại migration/triển khai production. Rollback code không được tái mở quyền SO; đối soát các thao tác phát sinh sau backup trước khi rollback dữ liệu.

## L. Ngoại lệ / công việc còn chặn

1. **Drive ACL `anyone: writer`** trên ba nguồn chính. Cần owner rà soát quyền kế thừa, người dùng thực và sửa chia sẻ; không thể coi SO bảo mật cho tới khi kiểm tra file cụ thể. Không thay ACL mù vì có thể cắt quyền cộng tác hợp lệ.
2. **Không có bản build/commit/deployment production và tài khoản UAT role**, nên không thể phát hành hoặc xác nhận sửa lỗi trên site đang chạy.
3. **Live v2.3 migration chưa chạy**; bản ghi legacy nhiều sản phẩm cần SO PDF để tách; counts và file ID chưa đối soát trước/sau.
4. **Browser visual QA chưa chạy:** Playwright cài được, Chromium download trả tệp không phải ZIP hợp lệ. DOM tests không chứng minh kích thước, khoảng cách, overflow thực.
5. **AI/PDF thực tế:** worker PDF là quy trình offline do người điều khiển; chưa tích hợp dịch/OCR/AI tự động cloud, chưa thử PDF khách hàng thật.
6. **Pháp lý:** theo trang chính thức của Ủy ban châu Âu được kiểm tra ngày 07/10/2026, mốc áp dụng hiện nêu 30/12/2026 cho doanh nghiệp lớn/vừa và 30/06/2027 cho doanh nghiệp nhỏ/siêu nhỏ, với ngoại lệ EUTR và sản phẩm mới; văn bản hợp nhất, Annex I, đánh giá nước sản xuất và phiên bản benchmark cần chuyên trách xác nhận. Không tự ghi `RULES_CONFIRMED` hay country risk row. Nguồn: [EC EUDR](https://environment.ec.europa.eu/topics/forests/deforestation/regulation-deforestation-free-products_en), [Regulation 2023/1115](https://eur-lex.europa.eu/eli/reg/2023/1115/oj).
7. **Chưa có dữ liệu chain/GEO live** và nhiều trường traceability; hồ sơ thật không thể vượt gate hoàn tất bằng suy đoán.

**Phán quyết:** mã v2.3 là bản staging để review/deploy có kiểm soát; **production acceptance = BLOCKED** cho đến khi các ngoại lệ 1–4 và các kịch bản liên quan được giải quyết bằng bằng chứng live.
