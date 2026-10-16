# KODA EUDR — nâng trực tiếp v2.9.1 lên v2.9.4

Gói cộng dồn, chỉ chứa các file cần thêm hoặc thay thế trên bản v2.9.1. Đã kế thừa bản sửa upload nhiều PDF v2.9.2 và gói v2.9.3 CONFIRM_AND_SPLIT_PDF_UPDATE đã phát hành. Không cần cài từng bản trung gian.

Đây là gói mã nguồn để triển khai; website và Apps Script đang chạy chưa được cập nhật bởi việc tạo ZIP này.

## 1. Các thay đổi

| Phần | Hành vi sau nâng cấp |
| --- | --- |
| Upload PDF, kế thừa v2.9.2 | Chọn nhiều PDF cùng lúc hoặc chọn thêm trong lúc upload; upload lần lượt; giữ file đã hoàn tất khi một file sau lỗi; có thể tạm dừng và tiếp tục. |
| Tách PDF, kế thừa v2.9.3 | Kiểm tra / sửa khoảng trang, xác nhận và tạo PDF con thật theo block. Giữ PDF gốc, thông tin trang nguồn và cơ chế tránh tạo trùng khi tiếp tục. PDF con vẫn chờ duyệt. |
| Bản đồ mới | OpenStreetMap + Leaflet, kéo / zoom, hiện các lô đã đăng ký và xem trước GeoJSON. Có nút mở ngay trong EUDR Dossier · Material / PO / lot. Không cần Google Maps API key hoặc bật Google billing. |
| GeoJSON gốc | Mở .geojson / .json, chọn feature, lưu nguyên nội dung file vào mục chứng từ thuộc block 04_Geolocation của material. Không cần đổi GeoJSON thành PDF. |
| LineString | Hiện dạng đường. Chỉ khi người dùng xác nhận đường khép kín là ranh giới lô mới tạo geometry Polygon để đăng ký. File gốc vẫn giữ LineString; ghi chú đăng ký lưu việc người dùng đã xác nhận chuyển đổi. |
| Prompt Material Dossier | Thêm MANDATORY VALIDATION BEFORE OUTPUT AND DRIVE UPLOAD cho prompt ChatGPT và luồng AI tự động. Tên supplier phải khớp nguyên văn, phân biệt hoa/thường, dấu câu và khoảng trắng trong chính excerpt của node. |
| Kiểm tra kết quả | Kiểm tra thêm field ngoài schema, excerpt OCR đúng nguyên văn, nhóm UNKNOWN, giới hạn byte và đọc lại JSON đã lưu trước khi xác nhận xử lý xong. |

Luồng tự nhận Business Review của v2.9.1 tiếp tục được giữ trong dự án nền. Gói này không yêu cầu chạy lại migration v2.9.0.

## 2. Cập nhật Apps Script — thay toàn bộ nội dung 3 file

Trong dự án Apps Script đang dùng, thay **toàn bộ** nội dung các file cùng tên bằng file trong thư mục `apps_script/` của gói:

1. `ClassificationService.gs`
2. `DossierService.gs`
3. `MaterialReviewService.gs`

Sau đó:

1. Save.
2. Deploy → Manage deployments → Edit deployment hiện tại.
3. Version: New version → Deploy.
4. Giữ nguyên URL Web App đang cấu hình trên Netlify.

Không tạo thêm bản sao của các file .gs trong cùng dự án. Không chỉ dán một hàm đơn lẻ vào cuối file cũ.

**Không cần migration, không đổi cấu trúc Sheet và không chạy lại `applyV290Migration` hoặc wrapper migration cũ.** Điều kiện là hệ thống hiện tại đã hoạt động trên v2.9.1.

## 3. Cập nhật website qua GitHub → Netlify

1. Giải nén ZIP.
2. Chép / ghi đè **các file trong `public/`** vào đúng `public/` của repository hiện tại. Giữ đầy đủ thư mục con `vendor/leaflet/` và thư viện PDF-Lib đính kèm.
3. Thay `netlify.toml` ở thư mục gốc repository bằng file của gói.
4. Commit / push theo quy trình GitHub → Netlify đang dùng; chờ deployment thành công.
5. Mở website và Ctrl+F5; nhãn giao diện phải là **v2.9.4**.

Đây là ZIP cập nhật, không phải toàn bộ website. **Không xóa repository cũ, không thay cả `public/` bằng riêng những file của gói, không kéo ZIP cập nhật này trực tiếp vào Netlify Drop.** Các file không có trong gói vẫn cần giữ lại.

Không cần thay Netlify Function hoặc biến môi trường. Thay đổi `netlify.toml` gửi Referer ở mức origin để nền OSM nhận diện website; CSP vẫn giữ script-src / style-src ở chế độ hiện có, không thêm unsafe-inline.

Nếu repository có tùy chỉnh riêng sau v2.9.1, đối chiếu các file trùng tên trước khi ghi đè. `DANH_SACH_FILE.json` liệt kê đủ 23 file ứng dụng cần cập nhật và SHA-256.

## 4. Cách dùng GeoJSON

1. Mở Order → EUDR Dossier · Material / PO / lot.
2. Chọn đúng material → **Mở bản đồ lô / GeoJSON**. Nút GEO đang có trong workspace cũng mở cùng màn hình.
3. Chọn file `.geojson` / `.json` tối đa **2 MB**. Đây mới là xem trước trên máy, chưa upload.
4. Nếu file có nhiều feature, chọn lô cần xử lý. Point, LineString, Polygon và các dạng Multi tương ứng có thể xem trước. GeometryCollection chưa hỗ trợ.
5. Nếu là LineString: chỉ đánh dấu xác nhận khi đường đã khép kín và thật sự là ranh giới lô. Đường chưa khép kín không thể đăng ký bằng cách chỉ đánh dấu checkbox.
6. Chọn mục chứng từ Geolocation của material. Người có POLICY_EDIT có thể chọn **Tạo mục chứng từ GeoJSON mới**, kiểm tra tên rồi bấm **Lưu file GeoJSON gốc**. Nếu chọn mục đã có bản nháp, thao tác tạo phiên bản mới theo cơ chế hiện tại; bản cũ vẫn nằm trong lịch sử. Mục đã Submitted / Approved không được thay ở đây.
7. Chọn quan hệ Plot / Producer / Forest owner phù hợp; nhập mã lô, quốc gia khai thác, thời gian, diện tích và độ chính xác nguồn từ chứng từ. Chứng từ vừa upload được chọn sẵn làm nguồn.
8. Bấm **Kiểm tra & đăng ký lô**. Bản ghi mới có trạng thái **REVIEW_REQUIRED**. Upload, đăng ký geometry, submit / duyệt chứng từ và review GEO vẫn là các bước riêng.

Nếu chưa có quan hệ Plot / Producer / Forest owner trong chuỗi cung ứng, vẫn xem trước và lưu được file, nhưng cần thêm quan hệ phù hợp trước khi đăng ký lô. Người không có quyền thêm task chọn task đã được người phụ trách chuẩn bị.

Đăng ký hiện hỗ trợ Point hoặc Polygon một vòng, tối đa 2.000 vị trí mỗi polygon. Multi-geometries và polygon có lỗ chỉ xem trước, cần chuyên viên xử lý trước khi đăng ký. File tối đa 100 feature và 10.000 vị trí tọa độ. Mỗi lần đăng ký một feature; có thể chọn feature khác trong cùng file và đăng ký tiếp với cùng chứng từ nguồn.

GEO được đăng ký theo material. Nếu cần liên kết với một PO/lot cụ thể, dùng luồng liên kết GEO trong Product · Material · PO / lot đang có; việc mở bản đồ từ Dossier không tự xác nhận mọi lô thuộc cùng PO.

Hệ thống không tự suy ra quốc gia, diện tích, thời gian hay độ chính xác thực tế của tọa độ từ hình hiển thị. Khi đổi feature, các thông tin riêng của lô được xóa để tránh dùng nhầm dữ liệu lô trước.

## 5. Prompt mới và kết quả Drive

Sau khi deploy backend, **tạo một prompt / lượt đánh giá mới** trong Material Dossier. Prompt đã lưu từ các lượt cũ được giữ nguyên lịch sử; mở lại prompt cũ không tự biến nó thành prompt mới.

Prompt mới yêu cầu:

- Tên node xuất hiện đúng nguyên văn trong excerpt của chính node; không tự chuẩn hóa tên hoặc thêm dấu chấm. Ví dụ `ISKRALEGNO S.R.L` khác `ISKRALEGNO S.R.L.`.
- Excerpt được chép nguyên văn từ đúng tài liệu / trang OCR; không sửa OCR để hợp thức hóa đề xuất.
- Kiểm tra key / endpoint, bằng chứng giao dịch cho từng edge, phân đoạn phủ đủ trang, đủ 8 topic, schema và giới hạn UTF-8 trước khi xuất.
- LEGALITY và DEFORESTATION giữ NOT_VERIFIABLE; ứng dụng hiện không có cơ chế cho AI tự ghi đè bằng một tuyên bố đã xác minh độc lập.
- Nếu có công cụ thực thi, chạy kiểm tra bằng chương trình; nếu không có thì thực hiện các bước kiểm tra rõ ràng, không tuyên bố đã chạy kiểm thử.
- Tìm đúng filename trong đúng folder; nếu đã có một file thì cập nhật chính file đó, không tạo thêm bản trùng. Nếu đã có nhiều bản trùng, báo rõ thay vì tạo tiếp.
- Đọc lại JSON sau khi lưu và so sánh với bản đã kiểm tra. Chỉ báo upload thành công sau khi xác minh. Tách biệt **saved to Drive** với **imported by EUDR**; chỉ ứng dụng mới xác nhận import.

Schema JSON giữ nguyên, không thêm trường báo trạng thái upload. Nếu cần báo trạng thái giao nhận, ChatGPT ghi ngoài nội dung JSON. Kết quả tối đa 48.000 UTF-8 byte; nên chừa dung lượng cho metadata kiểm tra của ứng dụng.

Ở luồng AI tự động, backend kiểm tra excerpt đối với OCR đã cung cấp và đọc lại JSON đã lưu trước khi ghi DONE. Ở luồng ChatGPT thủ công, backend không có OCR của mọi trang để tự chứng minh từng trích dẫn; trạng thái kiểm tra nguồn vẫn yêu cầu con người đối chiếu PDF. Kiểm tra bằng phần mềm không thay thế xác minh bằng chứng giao dịch thực tế.

Sau khi ChatGPT xác nhận đã lưu, dùng **Refresh results from Drive** trong Material Dossier để ứng dụng kiểm tra và nhập kết quả. Không coi một thông báo của ChatGPT là bằng chứng EUDR đã nhập thành công.

## 6. Nền bản đồ và cấu hình

Leaflet 1.9.4 được đóng gói trong website, không phụ thuộc CDN khi chạy. Nền mặc định là public OSM tiles, có ghi nguồn. Dịch vụ nền công cộng có chính sách sử dụng và không cam kết SLA; không bổ sung chức năng tải hàng loạt hoặc tải offline từ máy chủ này.

Nếu sau này cần đổi nhà cung cấp nền bản đồ, Admin / kỹ thuật sửa `public/map-config.js` với URL HTTPS, mức zoom và attribution đúng điều khoản nhà cung cấp; cập nhật thêm host cần thiết trong `img-src` của `netlify.toml`, rồi deploy lại. Đây là cấu hình mã nguồn, không phải cài đặt người dùng cuối.

Khi nền bản đồ không tải được, geometry và thông tin tọa độ vẫn còn; bản đồ không xác minh quyền sở hữu, tính hợp pháp, diện tích thực đo hoặc lịch sử mất rừng.

Tài liệu tham chiếu:

- https://leafletjs.com/download.html
- https://leafletjs.com/examples/geojson/
- https://operations.osmfoundation.org/policies/tiles/

## 7. Kiểm tra sau khi deploy

1. Thử chọn hai PDF ở một material tạo thủ công và kiểm tra cả hai được lưu.
2. Thử chức năng **Xác nhận & tách PDF** với một PDF mẫu; mở được PDF con đúng khoảng trang / block.
3. Mở một GeoJSON mẫu, kiểm tra LineString / Polygon, lưu file gốc và đăng ký một lô có chứng từ phù hợp.
4. Tạo prompt Material Dossier mới và tìm dòng **MANDATORY VALIDATION BEFORE OUTPUT AND DRIVE UPLOAD**.
5. Thử đóng / mở cửa sổ GEO, chuyển ngôn ngữ và xem trên điện thoại.

Kiểm thử cục bộ: 296/296 kiểm thử Node đạt; 3 kịch bản trình duyệt đạt với API và tiles giả lập (desktop EN, mobile VI, nền bản đồ không tải được); kiểm tra cú pháp đạt. Chưa thực hiện UAT với Apps Script / Drive production hoặc kết quả trả về từ một phiên ChatGPT thực tế. Xem `KIEM_THU_VA_GIOI_HAN.json`.

## 8. Quay lại v2.9.1 khi cần

Khôi phục các file cùng tên từ commit v2.9.1 đã lưu trước khi áp dụng gói; bỏ các file GEO / Leaflet mới nếu quay lại toàn bộ frontend. Triển khai lại phiên bản Apps Script và Netlify tương ứng. Không xóa chứng từ, PDF con hoặc GEO đã được tạo trong thời gian dùng bản mới. Gói này không thay schema nên không có bước rollback cấu trúc Sheet.
