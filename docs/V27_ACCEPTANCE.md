# Kiểm tra v2.7 sau deploy

Dùng một Order thử nghiệm và PDF có dữ liệu không nhạy cảm trước khi dùng hồ sơ thật.

| Ca kiểm tra | Kết quả mong đợi |
|---|---|
| Migration preview/apply/apply lại | Chỉ append header/tạo tab; không sửa các dòng SO/material cũ, không tự ghép nguồn. |
| Product 1 → Solid Wood PO1/L1; Product 2 → Solid Wood PO2/L2 + Walnut Veneer | Click Product 1 không hiện veneer/PO2; Product 2 chỉ hiện các nguồn của nó. |
| Hai product dùng chung source ID L1 | Một dossier/source được dùng lại, lượng phân bổ tổng không vượt lượng nguồn. |
| Import wood + steel, rubberwood, mô tả trộn wood/metal | Steel không tạo material; rubberwood giữ là wood; mixture/UNKNOWN vẫn review. |
| Source 2 có task cùng loại với Source 1 đã approved | Task Source 2 mới MISSING, không kế thừa document/approval của Source 1. |
| Hai upstream cấp vào cùng mill/lot | Cả hai nhánh đều được xét; thiếu chứng từ/plot của một nhánh vẫn blocker. |
| Mismatched lot, node+lot cycle, nhánh rời | Báo gap/cycle/disconnected; không hiển thị chain complete. |
| UOM/quantity thiếu hoặc khác đơn vị | NOT_VERIFIABLE; không tự tính tỷ lệ hay conversion. |
| GEO declared US / material lot harvest US / finished COO VN | Không đánh mismatch chỉ vì COO thành phẩm VN; vẫn phải reviewer xác minh tọa độ thực tế. |
| Một plot/certificate chung áp dụng hai lot | Liên kết hai source rõ ràng, không nhân bản PDF; task giao dịch vẫn riêng. |
| Upload 2–3 PDF; có file >4 MB; pause/resume | Network không PUT trực tiếp Drive từ browser; /api/call chunks <=1 MiB; SHA toàn file khớp khi finish. |
| Dossier AI nhiều PDF | Một job chạy nền, từng PDF có hash/pages/citations; task/document không bị tự approve. |
| Refresh sau khi đóng/mở lại workspace | Kết quả được lấy từ Drive; không yêu cầu import JSON. |
| Thay source lot/GEO/current PDF sau review | Kết quả hiện STALE hoặc source integrity error. |
| Source PDF mapping vào task | UPLOADED, giữ provenance/file; reviewer vẫn phải Submit/Review theo luồng cũ. |
| Remove material chỉ metadata SO/task trống | Preview REMOVE; xóa record/task chưa có hoạt động, giữ folder/audit. |
| Material có file/GEO/task được gán | Preview ARCHIVE; giữ file/history, không còn progress/reminder cho material đó. |
| Supplier user vào dossier nguồn của nội bộ | Bị chặn; quyền SO vẫn chỉ theo SO_VIEW và lineage. |
| Follow-up tasks | Chỉ tạo sau xác nhận; đúng owner/due, vào cùng Calendar KODA; không lặp task vì refresh. |

Chỉ xác nhận production sau khi thực hiện các ca trên bằng bridge đang dùng. Kiểm tra Execution log và Netlify function log bằng requestId khi thất bại; không gửi secrets vào log.
