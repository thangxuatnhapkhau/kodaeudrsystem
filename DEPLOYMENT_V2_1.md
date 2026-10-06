# KODA EUDR WORKSPACE 2.1 — audit, rollout và nghiệm thu

## 1. Đánh giá hiện trạng ngày 06/10/2026

| Thành phần | Hiện trạng / thay đổi |
|---|---|
| Frontend | Vanilla JS trong `public/index.html`, `app.js`, `style.css`; giữ thiết kế UI Redesign và logo gốc. Thêm `i18n.js`, đăng nhập, dialog, context panel. |
| Netlify | `call.mjs` giữ allowlist, HMAC, origin, request key và bridge. Thêm xác thực Firebase ID token; `auth.mjs` cấp/đổi/vô hiệu tài khoản qua Firebase Admin. |
| Apps Script | `Bridge.gs`, `AuthService.gs`, `Migration.gs`, `PromptService.gs`, `OrderService.gs`, `WorkspaceService.gs`; quyền `canOrder_`, `canTask_` và các vai trò vẫn do Sheet quyết định. |
| Sheet | `05_OWNER_MASTER` hiện có 10 header đúng nền V2. Thêm 4 cột cuối bằng `migrateV21()`. Không ghi lại `last_login`, role, supplier, assignments hoặc dữ liệu cũ. |
| Drive/Calendar | Dùng root và calendar đang cấu hình. Tên đơn trong Drive phải được nhân viên chọn nếu tìm thấy ứng viên; không tự gộp thư mục khác tên. |
| Bảo mật | Tài khoản Firebase hợp lệ vẫn bị từ chối nếu Sheet inactive/missing, UID khác, supplier disabled hoặc chưa đổi mật khẩu. Firebase service account là secret Netlify. |

**Đối chiếu mẫu:** Sheet đang ghi `SO25-2183` ở folder `1FaQkYfB14SkO6a6W8qoMbkbSFbsGQSsY` và Sales Order file `1ESiBgqAAFkH74PfnbXVjtMtF4V0hGkBd`. Folder `10jTl9zpDq1htpwrhoMh4jlqMBvcBTsvD` và PDF `11TEqqw9b4nCxfg9Psyyzm9ufE5df0GB-` được nêu trong brief là một bộ nguồn khác có tên `SO25-2183(VN) - COMPLETED`, cùng Drive root. Không tự đổi `01_SO_MASTER` hay `06_DOCUMENT_REGISTER` sang bộ nguồn kia. Người phụ trách phải quyết định mối quan hệ/phiên bản giữa hai bộ trước khi dùng bộ hoàn tất làm bằng chứng chính.

## 2. Trình tự triển khai

1. **Sao lưu & nhánh (IT):** bản sao production repo, Netlify env (qua quản trị secret), Apps Script version/deployment ID, workbook và root Drive metadata. Tạo nhánh `upgrade/eudr-workspace-v2-1`.
2. **Mã staging (IT):** áp dụng toàn bộ file gói; `npm ci && npm run check && npm test`. `package-lock.json` đi cùng gói. Không đưa `node_modules`, mật khẩu, token hay service account vào GitHub.
3. **Mã Apps Script & migration staging (Apps Script admin):** cập nhật source `.gs` vào script staging nhưng chưa phát hành web app; backup workbook, kiểm tra `05_OWNER_MASTER` kết thúc ở `created_by`, chạy `migrateV21()`; kiểm tra kết quả `added:4`, so sánh số dòng và các cột cũ trước/sau. Chạy lại phải trả `added:0`.
4. **Apps Script staging (IT):** sau khi migration thành công, tạo deployment mới; kiểm tra `BRIDGE_SECRET`, `ALLOWED_ORIGINS`, `DB_ID`, `ROOT_ID`, `CALENDAR_ID`; không thay Drive root hoặc Calendar. Đặt URL `/exec` tại Netlify staging.
5. **Firebase staging (IT):** bật Email/Password; thêm authorized domain staging. Tạo service account dùng cho Firebase Admin; bảo vệ secret. Tài khoản ADMIN đầu tiên được bootstrap qua Firebase console và được ràng buộc bằng `bootstrapFirebaseAdmin(uid)` trong Apps Script staging sau khi hai người kiểm tra UID; tài khoản khác cấp từ Users. Tài khoản admin này không đặt `must_change_password=YES` nếu đã thiết lập mật khẩu riêng an toàn.
6. **Netlify staging (IT):** set đúng biến trong `.env.example`; `ALLOWED_ORIGINS` chứa origin staging chính xác; deploy preview. `LEGACY_TOKEN_LOGIN=false`. Giữ registry token cũ ở server trong giai đoạn rollback, không hiển thị login token ở UI.
7. **QA & UAT (Marketing/EUDR reviewer/IT):** checklist mục 3, có ảnh/chứng cứ test của 6 vai trò và hai ngôn ngữ. Thực hiện kiểm tra pháp lý bằng người có thẩm quyền; chỉ họ nhập phiên bản và nguồn trong Settings.
8. **Production (IT, sau khi staging đạt):** backup mới; cập nhật source Apps Script production nhưng chưa phát hành; chạy `migrateV21()` trên production; sau đó triển khai Apps Script version mới; cấu hình Firebase/Netlify production; smoke test trước khi cắt token. Không chạy `setup()` và không reset Google Sheet.
9. **Cutover (IT):** chỉ tắt token cũ khi toàn bộ user đã vào được Firebase. Sau nghiệm thu, gỡ `TOKEN_HASHES_JSON`, `PILOT_ADMIN_TOKEN`, cờ tương thích. `BRIDGE_SECRET` vẫn giữ.

## 3. QA và cổng nghiệm thu

**Đã chạy cục bộ:** `node --check` thành công; 47 test backend/bridge/migration/auth đã qua. Test bao gồm quyền supplier, HMAC, nonce, tạo đơn retry, folder chọn tay, material confirmation, versioning, GEO, Calendar, prompt context, first-login gate, legal confirmation. Không có kết nối staging thực trong test.

**Phải chạy ở staging trước production:** 6 vai trò × EN/VI × desktop/tablet/mobile; login sai/đúng; account inactive/missing/disabled; đổi mật khẩu tạm → đăng nhập lại → mật khẩu cũ bị từ chối; reset password; provision/disable; upload và download; Calendar sync; AI prompt mẫu; 10 tình huống Create Order (thường, image, trùng SO, PDF sai, quá 3 MB, timeout, retry, double-click, không quyền, mất mạng). Đối chiếu số folder, dòng `01_SO_MASTER`, dòng `06_DOCUMENT_REGISTER`, audit `ORDER_CREATED` trước/sau retry. Kiểm tra không có mật khẩu/token trong log. Thử `LEGACY_TOKEN_LOGIN=false` rồi kiểm tra token cũ bị từ chối.

**Chưa xác minh tại phiên này:** Firebase project/service account thực tế; triển khai Netlify/Apps Script staging; UAT có đăng nhập; responsive visual QA. Tải Chromium cho local visual test không thành công trong môi trường này; không tuyên bố đã qua manual QA.

## 4. Nguồn pháp lý EU để người có thẩm quyền rà soát

- [Regulation (EU) 2023/1115, bản hợp nhất 18/09/2026](https://eur-lex.europa.eu/eli/reg/2023/1115/2026-09-18/eng).
- [Regulation (EU) 2025/2650](https://eur-lex.europa.eu/eli/reg/2025/2650/oj/eng).
- [Commission Delegated Regulation (EU) 2026/2102, Annex I](https://eur-lex.europa.eu/eli/reg_del/2026/2102/oj/eng).
- [Commission Implementing Regulation (EU) 2025/1093, phân hạng quốc gia](https://eur-lex.europa.eu/eli/reg_impl/2025/1093/oj/eng).
- [European Commission EUDR official page](https://environment.ec.europa.eu/topics/forests/deforestation/regulation-deforestation-free-products_en), [FAQ](https://environment.ec.europa.eu/publications/faq-eudr-implementation_en) và [Guidance](https://green-forum.ec.europa.eu/publications/guidance-document-regulation-eu-20231115-deforestation-free-products_en).

Trang Ủy ban công bố 30/12/2026 cho doanh nghiệp lớn/vừa và nhóm nhỏ thuộc EUTR; 30/06/2027 cho nhóm micro/nhỏ khác; **30/12/2027** cho các sản phẩm mới thêm bởi 2026/2102. Vietnam thuộc low-risk trong 2025/1093, nhưng không đủ để duyệt đơn hoặc nhà cung cấp. Phạm vi sản phẩm vẫn cần HS/CN và Annex I bản hiện hành. Không tự xác nhận `RULES_CONFIRMED=YES`.

## 5. Rollback

1. Dừng cutover và giữ dữ liệu mới; không xóa dòng Sheet hoặc audit.
2. Trỏ Netlify về deploy trước, Apps Script về version/deployment trước; khôi phục env cũ từ bản sao an toàn. Nếu trước đó đã tắt legacy, bật lại registry token cũ có kiểm soát trong thời gian xử lý.
3. Bốn cột auth thêm vào cuối Sheet **được để nguyên** trong rollback, vì code cũ bỏ qua phần mở rộng. Không xóa cột nếu đã có user mới hoặc audit.
4. Đối chiếu Calendar, Drive, `21_OPERATIONS`, `08_ACTIVITY_LOG`, số dòng và version tài liệu; cô lập các thao tác có trạng thái `RETRY_REQUIRED` trước khi retry.
5. Sau khi xác định nguyên nhân, sửa staging và chạy lại cổng nghiệm thu. Việc đổi mật khẩu Firebase đã xảy ra không tự đảo ngược; dùng quy trình reset nếu cần.
