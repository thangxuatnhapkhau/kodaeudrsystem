# KODA EUDR 2.1 — bản sửa đăng nhập Firebase, 07/10/2026

## Phát hiện đã có bằng chứng

- Trình duyệt báo POST `/api/call` trả HTTP 401.
- Trong gói Firebase 2.1, HTTP 401 ở endpoint này phát sinh khi Netlify xác minh tài khoản/token Firebase thất bại, trước khi gọi Apps Script.
- Mã cũ chuyển tất cả lỗi xác minh, kể cả cấu hình service account sai, thành `AUTH_REQUIRED`.
- Backend yêu cầu `email_verified=true`, nhưng giao diện cũ không có bước gửi email xác minh.
- Cảnh báo CSP về inline style/script cần xử lý riêng; chúng không giải thích phản hồi HTTP 401 này.

Chưa đọc được token hoặc cấu hình service account thật nên chưa kết luận nguyên nhân Firebase cụ thể của tài khoản. Bản sửa này bổ sung luồng xác minh email và làm rõ các lỗi còn lại.

## Cài đặt trên repo đang deploy Netlify

1. Giải nén gói này.
2. Trong GitHub, thay các file đang có bằng file cùng đường dẫn:
   - `netlify/functions/_firebase.mjs`
   - `netlify/functions/call.mjs`
   - `netlify/functions/auth.mjs`
   - `public/app.js`
   - `public/i18n.js`
3. Commit thay đổi; đợi Netlify deploy hoàn tất. Nếu repo không tự deploy, vào Netlify → Deploys và chạy deploy.
4. Mở web, nhấn Ctrl+F5, đăng nhập bằng email và mật khẩu hiện tại.

Không cần thay Apps Script, chạy setup/migration/bootstrap hoặc sửa dòng ADMIN để cài bản sửa này. Bản sửa giữ nguyên kiểm tra chữ ký bridge, UID, email đã xác minh, token thu hồi và quyền Sheet.

## Khi màn hình yêu cầu xác minh email

1. Bấm **Gửi email xác minh / Send verification email**.
2. Mở hộp thư của email đăng nhập; kiểm tra Spam nếu cần; mở liên kết Firebase gửi.
3. Quay lại web, bấm **Tôi đã xác minh email / I have verified my email**.

Không tự gửi email trước khi người dùng bấm nút. Ứng dụng kiểm tra trạng thái xác minh, lấy token mới và mới gửi yêu cầu `recordLogin`. Trạng thái xác minh trong giao diện không thay cho xác minh ở server.

## Nếu vẫn bị từ chối, đọc mã mới trên web

| Mã | Việc cần làm |
| --- | --- |
| `AUTH_EMAIL_UNVERIFIED` | Xác minh email theo luồng trên. |
| `AUTH_TOKEN_EXPIRED` / `AUTH_TOKEN_REVOKED` | Đăng nhập lại bằng mật khẩu hiện tại. |
| `AUTH_TOKEN_INVALID` | Kiểm tra Web API Key và service account thuộc cùng Firebase project. |
| `AUTH_ACCOUNT_DISABLED` | Quản trị kiểm tra trạng thái tài khoản trong Firebase. |
| `FIREBASE_CONFIG_INVALID` | Kiểm tra `FIREBASE_SERVICE_ACCOUNT_JSON` là toàn bộ JSON service account, có `project_id`, `client_email`, `private_key`; `project_id` phải trùng `FIREBASE_PROJECT_ID`. Không dùng object cấu hình Firebase Web cho biến này. |
| `FIREBASE_PERMISSION_DENIED` | IT kiểm tra quyền Firebase Authentication của service account. |
| `FIREBASE_UNAVAILABLE` | IT kiểm tra kết nối tới Firebase và Netlify Functions logs; thử lại khi dịch vụ hoạt động. |

Netlify Functions logs ghi `FIREBASE_AUTH_FAILURE` cùng mã an toàn và requestId. Mật khẩu, token, private key và JSON service account không được ghi vào log. Chỉ cần chia sẻ mã lỗi và requestId để chẩn đoán.

`GET /api/auth` trả `enabled:true` chỉ xác nhận biến tồn tại; không kiểm tra khóa service account hoặc quyền thật.

## Kiểm thử

- `npm run check`: thành công.
- `npm test`: 52/52 thành công, gồm 47 kiểm thử hiện có và 5 kiểm thử bổ sung.
- Đã kiểm thử tài khoản chưa xác minh không gọi bridge, gửi email chỉ sau thao tác người dùng, token được refresh trước khi ghi nhận đăng nhập, lỗi cấu hình không bị che và dữ liệu nhạy cảm không vào thông báo/log.
- Kiểm thử dùng môi trường mô phỏng; chưa triển khai hoặc đăng nhập vào Firebase/Netlify thật bằng tài khoản người dùng.

## Hoàn tác

Khôi phục 5 file trên về commit trước hoặc deploy lại bản Netlify trước. Bản sửa không thay đổi dữ liệu Sheet hay Apps Script.

## Tài liệu chính thức

- Firebase Auth REST: https://firebase.google.com/docs/reference/rest/auth
- Firebase Admin lỗi xác thực: https://firebase.google.com/docs/auth/admin/errors
- Firebase xác minh ID token: https://firebase.google.com/docs/auth/admin/verify-id-tokens
