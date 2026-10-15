# Cập nhật v2.8 → v2.9.0 — chỉ các file cần thay đổi

Gói này có **20 file ứng dụng: 12 file thay thế, 8 file thêm mới**. Đường dẫn giữ nguyên cấu trúc repository. Không có bản demo, node_modules, tài liệu audit dài hoặc file ứng dụng không thay đổi.

| Vị trí | Số file | Thao tác |
|---|---:|---|
| `apps_script/` | 12 | Thay 5 file hiện có; tạo thêm 7 file .gs |
| `public/` | 7 | Thay 6 file; thêm `intelligence.js` |
| `netlify/functions/` | 1 | Thay `call.mjs` |

Tên từng file và thao tác THÊM MỚI / THAY THẾ nằm trong `DANH_SACH_FILE.txt`. Hash của file đích và những bản gốc đã đối chiếu nằm trong `DANH_SACH_FILE.json`.

## 1. Chép file vào bản 2.8 đang có

1. Sao lưu repository, Apps Script source/properties và database đang dùng.
2. Với repository: chép `public/`, `netlify/` và `apps_script/` trong gói vào đúng thư mục tương ứng của bản 2.8. Cho phép ghi đè các file trùng tên. Giữ nguyên các file khác.
3. Với Apps Script đang chạy: nội dung thư mục `apps_script/` trong GitHub chưa tự cập nhật project Google Apps Script. Phải cập nhật đúng 5 file cũ và tạo thêm đủ 7 file .gs trong cùng project, hoặc dùng quy trình đồng bộ Apps Script hiện có. Không xóa các service cũ khác.

**Không kéo riêng ZIP này vào Netlify Drop hoặc thay toàn bộ repository bằng nội dung ZIP.** Đây là gói bổ sung cho bản 2.8; các file không thay đổi như vendor PDF/OCR, font/WASM, ảnh/logo, Firebase functions, `appsscript.json`, `Code.gs`, `Migration.gs`, `netlify.toml` và template Excel vẫn phải có trong bản cũ.

Không cần đổi `package.json` / `package-lock.json` hoặc cài dependency mới cho chức năng v2.9. Các thư viện đang dùng ở v2.8 được giữ nguyên. File `Migration.gs` chỉ khác một dòng trắng trong gói đầy đủ nên đã được loại khỏi gói tối giản này.

## 2. Cấu hình và migration trên staging trước

Giữ DB_ID, ROOT_ID, CALENDAR_ID, bridge secret, Firebase, origins và URL hiện có ở đúng môi trường. Với staging, dùng bản sao database/Drive và lịch thử nghiệm riêng.

Trong Script Properties, mặc định đặt:

```text
EXTERNAL_AI_ENABLED=false
AI_ENABLED=false
```

Ask nội bộ, Review Pack ChatGPT Business, nhập JSON, classification, Issues, BOM và Customer Submission không cần API key hoặc worker. Các luồng Gemini cũ sẽ không gọi model khi hai flag này tắt.

Sau khi lưu đủ file .gs:

1. Chạy `previewV290Migration()` trong Apps Script editor.
2. Kiểm tra toàn bộ plan và sao chép `plan_hash` được trả về. Với schema đã đọc ngày 14/10/2026, cần tạo chín tab mới; không dịch cột hay đổi tên bảng cũ.
3. Sau khi đồng ý áp dụng migration trên môi trường đã chọn, gọi:

```javascript
applyV290Migration({confirmed:true,plan_hash:'PLAN_HASH_TU_PREVIEW'});
```

Apps Script editor không truyền tham số khi bấm Run. Nếu cần, thêm tạm hàm sau vào editor, thay hash rồi chọn hàm này để Run:

```javascript
function runApprovedV290Migration() {
  return applyV290Migration({
    confirmed: true,
    plan_hash: 'PLAN_HASH_TU_PREVIEW'
  });
}
```

Hàm migration tạo backup workbook trước khi thay đổi và ghi ID vào `V290_LAST_BACKUP_ID`. Nếu schema thay đổi, chạy lại preview. Không dùng `previewV27Migration` / `applyV27Migration` để cài v2.9.

Trên database production đã nhận diện, migration còn yêu cầu Script Property `V290_PRODUCTION_MIGRATION_APPROVED=true`. Chỉ đặt sau khi người có thẩm quyền phê duyệt thay đổi dữ liệu thật; không đặt để bỏ qua bước kiểm thử.

## 3. Deploy Apps Script rồi deploy website

1. Hoàn tất migration và kiểm tra trên staging.
2. Cập nhật deployment Apps Script bằng version mới. Nếu sửa deployment hiện có, giữ nguyên URL bridge; nếu URL thực sự đổi, cập nhật `APPS_SCRIPT_WEBAPP_URL` tương ứng tại Netlify. Giữ secret ở backend.
3. Deploy repository đã chép đủ file lên Netlify theo quy trình đang dùng. Deploy frontend sau khi backend và schema đã sẵn sàng.
4. Kiểm tra đăng nhập Admin, New Order, bốn block chứng từ, Order cũ, upload, Ask không API, Review Pack/import, Issues/Calendar và Customer Submission.

Hướng dẫn này không thực hiện deploy, gửi lời mời Calendar hoặc thay đổi dữ liệu/quyền chia sẻ thật.

## Phạm vi tương thích và trạng thái

Gói được tách bằng đối chiếu source nhánh 2.8 đã cung cấp trong Drive ngày 14/10/2026, có tính đến patch AI v2.8.8. Nhãn website đã thấy là v2.8.2; chưa xác minh được Git commit hoặc Apps Script revision đang deploy. Nếu bản đang dùng có chỉnh sửa riêng sau đó, so sánh trước khi ghi đè; không xem nhãn phiên bản là bằng chứng source giống hệt.

Đã thử dựng lại từ baseline và chép đúng 20 file này, rồi chạy bộ test hiện hành bằng harness của gói đầy đủ. File kiểm thử/harness không nằm trong gói deploy tối giản; dùng gói đầy đủ nếu cần chạy lại đúng bộ QA v2.9.

Đây vẫn là bản ứng viên staging. Cần xử lý quyền database `anyone with the link — writer` đã ghi nhận trước production theo phê duyệt chủ sở hữu. Không tự đổi legal config đang NOT_REVIEWED thành đã xác minh.

Nếu cần rollback, dùng repository/Apps Script deployment đã sao lưu. Giữ lại các bảng 35–43 và hồ sơ mới để đối chiếu; không tự xóa tab hoặc ghi đè database bằng backup khi chưa kiểm tra giao dịch phát sinh sau nâng cấp.
