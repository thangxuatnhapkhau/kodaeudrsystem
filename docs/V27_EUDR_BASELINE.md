# EUDR — nền tảng pháp lý cho reviewer

Ngày nghiên cứu: 13/10/2026. Đây là reference cho chức năng review, không tự đánh dấu RULES_CONFIRMED hoặc cập nhật country risk của hệ thống.

Nguồn chính thức:

- [European Commission — Regulation on Deforestation-free products](https://environment.ec.europa.eu/topics/forests/deforestation/regulation-deforestation-free-products_en)
- [European Commission — cập nhật product scope/tools, 13/07/2026](https://environment.ec.europa.eu/news/commission-updates-product-scope-and-tools-support-eudr-2026-07-13_en)
- [European Commission — triển khai và tài liệu hỗ trợ](https://green-forum.ec.europa.eu/nature-and-biodiversity/deforestation-regulation-implementation_en)
- [Regulation (EU) 2023/1115 — EUR-Lex, kiểm tra bản hợp nhất/amendments khi duyệt](https://eur-lex.europa.eu/eli/reg/2023/1115/oj)
- [Regulation (EU) 2025/2650 — sửa đổi EUDR](https://eur-lex.europa.eu/eli/reg/2025/2650/oj)

Theo thông tin EC được kiểm tra, mốc áp dụng là 30/12/2026 cho large/medium operators và micro/small đã thuộc EUTR; 30/06/2027 cho micro/small còn lại. Scope Annex I đã có thay đổi: reviewer phải đối chiếu CN code, phiên bản và ngày hiệu lực cụ thể, không dùng danh sách cũ cố định.

Thiết kế v2.7 theo các điểm sau:

- Truy xuất mọi plot của nguồn nguyên liệu, không dừng ở tier 1/FSC license hay một nhánh có đủ file. Phải đối chiếu luồng hàng, lot, loài gỗ, quantity/UOM và thông tin ngày/quốc gia sản xuất.
- Tọa độ geolocation cần độ chính xác thật ít nhất sáu chữ số thập phân; plot gỗ trên 4 ha cần polygon. Không thêm số 0 để biến tọa độ thiếu chính xác thành “đạt”.
- Mốc 31/12/2020 liên quan deforestation/forest degradation; không có nghĩa mọi ngày khai thác trước 2021 đều tự động không hợp lệ. Harvest period và kiểm chứng mất rừng là hai câu hỏi khác nhau.
- COO thành phẩm có thể khác quốc gia khai thác sau chế biến. GEO phải được xác minh với harvest/production country của nguồn, không chỉ so tên nước trên COO thành phẩm.
- Chứng nhận và checklist file không thay thế legality, risk assessment và risk mitigation khi áp dụng. Việc xác minh hồ sơ/ảnh vệ tinh, risk outcome và nghĩa vụ DDS thuộc người được ủy quyền theo vai trò thực tế.
- NON_WOOD trong import là quyết định vận hành của workspace gỗ. Không dùng nó làm kết luận pháp lý cho các commodity EUDR khác hoặc mọi sản phẩm ngoài gỗ.

AI trả kết quả để bổ sung/đối chiếu/xác minh; không tự approve chứng từ, không chứng nhận EUDR compliance và không nộp DDS. Trước khi cập nhật legal baseline/country risk, reviewer cần kiểm tra văn bản hợp nhất, guidance/FAQ mới nhất, scope của KODA và yêu cầu hồ sơ tại từng nước khai thác.
