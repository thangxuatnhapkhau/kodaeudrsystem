# KODA EUDR WORKSPACE v2.1 — gói staging

**Trạng thái:** mã nguồn đã biên dịch và kiểm thử cục bộ. Chưa triển khai Netlify/Apps Script, chưa bật Identity trên site thật, chưa chạy smoke test với tài khoản được mời. Không sử dụng gói này để thay thế production trực tiếp.

## 1. Trước → Sau

| Phần | Bản staging 2.0 | Bản 2.1 |
|---|---|---|
| Đăng nhập | Người dùng nhập personal token | Email/mật khẩu qua Netlify Identity, invite-only; Function xác minh phiên |
| Phân quyền | Apps Script đối chiếu email trong `05_OWNER_MASTER` | Giữ nguyên; email lấy từ Identity đã xác minh và ký HMAC |
| Ngôn ngữ | Giao diện tiếng Anh | Bộ từ điển VI/EN tập trung, nút trên header, lưu lựa chọn |
| Tạo đơn | Đợi và chuyển trang ngay | Trạng thái đang xử lý, kết quả thành công/lỗi, chọn bước tiếp theo |
| AI prompt | Mô tả ngắn, yêu cầu đính kèm file | ID/file/folder/Sheet/tab thực, chế độ hành động, nguồn và đích rõ ràng |
| Pháp lý | Cảnh báo khi cấu hình chưa rà soát | Giữ cảnh báo; bổ sung nguồn chính thức để người có thẩm quyền kiểm tra |

Luồng: **Browser → Netlify Identity session → `/api/call` Function v2 → signed bridge → Apps Script → Sheet/Drive/Calendar**.

Identity chỉ xác thực danh tính. Apps Script vẫn đối chiếu `05_OWNER_MASTER` ở **mỗi request** và áp dụng quyền theo vai trò, đơn hàng, nhà cung cấp. Không lấy role từ frontend hoặc metadata Identity làm quyền KODA.

## 2. Tệp thay đổi

| Tệp | Mục đích | Rủi ro cần kiểm tra |
|---|---|---|
| `src/app.js` | Đăng nhập/mời/khôi phục mật khẩu, Create Order, Prompt Studio, giao diện hai ngôn ngữ | Phiên Identity và callback trên Netlify |
| `src/i18n.js` | Từ điển tập trung và chuyển ngôn ngữ khi giữ nguyên màn hình hiện tại | Kiểm tra tất cả chuỗi động |
| `public/app.js` | Bản đã bundle, dùng khi site chạy | Luôn chạy build trước triển khai |
| `public/index.html`, `public/style.css` | Tên sản phẩm, tagline, nút ngôn ngữ, phản hồi tiến trình | Responsive và accessibility |
| `netlify/functions/call.mjs` | Xác minh Identity bằng `getUser()`, ký actor, giữ origin/action/HMAC | Chỉ chạy Function v2 trên Netlify |
| `apps_script/PromptService.gs` | Nguồn đúng trong Drive và đích cập nhật có kiểm soát | Quyền đọc file, đường dẫn thực, nguồn thiếu |
| `apps_script/AuthService.gs`, `Bridge.gs`, `Code.gs` | Audit đăng xuất, allowlist, tên sản phẩm | Deploy đủ toàn bộ tệp Apps Script |
| `package.json`, `package-lock.json`, `netlify.toml`, `.env.example` | Build, dependency Identity và cấu hình | Build deploy từ repository |
| `tests/v2.1.test.mjs` | Kiểm tra actor ký, origin, lỗi quyền, provenance của prompt | Chưa thay thế smoke test thật |

## 3. Cấu trúc dữ liệu

**Không cần đổi schema Sheet.** Đã đọc metadata 23 tab và các header trọng yếu của workbook thật. Không ghi dữ liệu vào Sheet. `09_CONFIG` hiện chứa version pháp lý `NOT_REVIEWED`; cảnh báo hiện hành phải tiếp tục hiển thị. `22_COUNTRY_RISK` hiện chỉ có header. Người có thẩm quyền rà soát nguồn pháp lý rồi ghi qua chức năng Settings; không tự điền Vietnam `LOW` bằng mã nguồn.

## 4. Cấu hình

### Netlify staging

1. Tạo nhánh từ repository **thực sự đang kết nối với site**; so sánh diff với source production trước khi merge. Bản production quan sát ngày 06/10/2026 vẫn có tiêu đề `KODA EUDR · Evidence workspace`, khác ZIP staging này.
2. Commit các tệp trong gói 2.1 lên nhánh đó. Build command: `npm run build`; publish `public`; Functions `netlify/functions`. Chạy `npm ci` trong CI nếu dùng lockfile.
3. Trên Netlify staging, bật **Identity**; trong **Identity → Registration → Registration preferences**, chọn **Invite only**. Mặc định là Open nên phải kiểm tra thủ công.
4. Cấu hình env `APPS_SCRIPT_WEBAPP_URL=<SET_IN_NETLIFY_UI>`, `BRIDGE_SECRET=<SET_IN_NETLIFY_UI>`, `ALLOWED_ORIGINS=<STAGING_ORIGIN>`. Không đưa giá trị secret vào Git, Sheet, trình duyệt hoặc báo cáo.
5. Trong Apps Script staging, đặt Script Properties `BRIDGE_SECRET=<SET_IN_APPS_SCRIPT_PROPERTIES>`, `ALLOWED_ORIGINS=<STAGING_ORIGIN>`, `DB_ID=<STAGING_SHEET_ID>`, `ROOT_ID=<STAGING_ROOT_FOLDER_ID>`, `CALENDAR_ID=<STAGING_CALENDAR_ID>` theo cấu hình đang có. Secret hai đầu bridge phải khớp.
6. Deploy Apps Script **phiên bản mới** với toàn bộ tệp `.gs`; cập nhật `APPS_SCRIPT_WEBAPP_URL` của **staging**. Không chạy `setup()` hay `migrateV2()` trên workbook thật vì schema đã tồn tại.
7. Thêm user trong `05_OWNER_MASTER`, sau đó mời **đúng email đó** trong Identity → Users. User tự tạo mật khẩu. Tắt đăng ký công khai.

Với bản 2.1, `TOKEN_HASHES_JSON`, `PILOT_ADMIN_TOKEN` và `ALLOW_PILOT_ADMIN` không được đọc bởi Function mới. Chỉ xóa/thu hồi chúng sau khi hoàn tất cutover và cửa sổ rollback.

## 5. QA và giới hạn hiện tại

| Kiểm tra | Trạng thái | Bằng chứng |
|---|---|---|
| Cú pháp JS, build bundle | PASS | `npm run check`, `npm run build` |
| Identity email được ký; bỏ qua email/role giả từ browser | PASS cục bộ | `tests/v2.1.test.mjs` |
| Origin thiếu hoặc phiên thiếu bị chặn; 403 giữ nguyên | PASS cục bộ | `tests/v2.1.test.mjs` |
| Prompt có ID nguồn, link Drive/Sheet, đích tab, action mode; nguồn mất thì lỗi | PASS cục bộ | `tests/v2.1.test.mjs` |
| SO25-2183 nằm trong `00_SO` của folder đơn đã ghi nhận | PASS metadata | Đọc Sheet và Drive bằng quyền hiện có |
| Đăng nhập, mời, reset password, 6 vai trò, supplier isolation | PENDING staging | Cần bật Identity và tài khoản kiểm thử |
| Tạo đơn thật, retry/timeout, upload, Calendar, legal warning | PENDING staging | Cần Deploy Preview và backend staging |
| Hai ngôn ngữ trên mọi màn hình, keyboard/mobile | PENDING manual | Cần xem UI trên staging |
| 47 acceptance/security scenarios trong yêu cầu | PENDING full QA | Chưa có môi trường staging kết nối |

**Không tuyên bố đã đạt acceptance đầy đủ.** Các bài test cũ `tests/v2.test.mjs` thuộc bản token 2.0, lưu như tham chiếu và không phải gate 2.1.

## 6. Kiểm tra phát hành và rollback

1. Dùng Deploy Preview với Identity staging, Sheet/Drive/Calendar staging; chạy ma trận QA trong yêu cầu.
2. Kiểm tra ADMIN, MARKETING, EUDR_REVIEWER, VIEWER, SUPPLIER_USER, user inactive và không có trong Owner Master. Test tài liệu, order và task chéo phạm vi.
3. Tạo SO thử **mới** trên staging; kiểm tra một hàng `01_SO_MASTER`, một folder, một SO document, request key, trạng thái thành công và retry.
4. Test prompt SO25-2183 (chỉ đọc); không nhập dữ liệu AI vào workbook production để thử.
5. Rà soát bản pháp lý theo `LEGAL_REFERENCE.md`; người được ủy quyền ghi version và ngày. `LOW RISK` không thành badge tuân thủ.
6. Chỉ sau khi staging đạt: đưa mã lên nhánh production, cập nhật Netlify Identity/config và Apps Script production theo cùng phiên bản; xác nhận người dùng đã nhận lời mời; sau rollback window mới thu hồi token cũ.
7. Nếu cần rollback: quay về commit/deploy trước đó **và** Apps Script deployment URL cũ cùng cấu hình auth cũ trong cửa sổ rollback. Không xóa/khôi phục đè hàng Sheet hay file Drive; các giao dịch phát sinh trong staging/production được giữ và đối chiếu qua `08_ACTIVITY_LOG` và `21_OPERATIONS`.

## 7. Lệnh cục bộ

```bash
npm ci
npm run check
npm run build
npm test
```

Môi trường `netlify dev` không thay thế bài test Identity trên Deploy Preview. Gói bao gồm mã nguồn đầy đủ, không có giá trị secret.
