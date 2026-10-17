// Display labels only. Backend enums, evidence, IDs and user-entered values stay canonical.
const translations={
 en:{
  REMOVE_CHILDREN_FIRST:'Remove child relationships first.',REMOVE_HAS_HISTORY:'This relationship has evidence or GEO history and cannot be removed.',REMOVE_ASSIGNED_TASKS:'These relationship tasks have assignments or activity. Resolve them before removal.',REMOVE_MATERIAL_LINKED:'This material has relationships, tasks, evidence or GEO. Resolve the links first.',REMOVE_SUPPLIER_LINKED:'This supplier is linked to relationships, evidence or users. Resolve the links first.',REMOVE_USER_ASSIGNED:'Reassign open orders, tasks and uploads before removing this user.',REMOVE_USER_LOGIN:'The login could not be disabled. The user remains disabled; retry removal.',SCHEMA_MISMATCH:'The Sheet schema needs the documented migration before user removal.',EXPORT_ORPHANED_EVIDENCE:'Evidence has a missing Material, Relationship or Evidence Type. Review its links before exporting.',
  APPROVED:'Approved internally',REJECTED:'Rejected',MORE_INFO_REQUIRED:'More information needed',IN_REVIEW:'In review',SUBMITTED:'Submitted',UPLOADED:'Uploaded',MISSING:'Missing',
  VERSION_CONFLICT:'The document or data changed. Reopen the document and review its active version.',
  AUTH_EMAIL_UNVERIFIED:'Verify your email before signing in.',
  AUTH_TOKEN_EXPIRED:'Your session expired. Sign in again.',
  AUTH_TOKEN_REVOKED:'Your session was revoked. Sign in again.',
  AUTH_TOKEN_INVALID:'Your login session is not valid for this project. Sign in again.',
  AUTH_ACCOUNT_DISABLED:'This login account is disabled. Contact your administrator.',
  FIREBASE_CONFIG_INVALID:'Firebase server credentials are invalid. Ask your administrator to check FIREBASE_SERVICE_ACCOUNT_JSON and FIREBASE_PROJECT_ID.',
  FIREBASE_PERMISSION_DENIED:'Firebase service account lacks Authentication permissions. Contact your administrator.',
  FIREBASE_UNAVAILABLE:'Firebase verification is temporarily unavailable. Try again.'
 },
 vi:{
"Plot map":"Bản đồ lô khai thác","Choose GeoJSON, inspect the plot, then register it with its original evidence.":"Chọn GeoJSON, kiểm tra lô trên bản đồ, sau đó đăng ký kèm chứng từ gốc.","Show all plots":"Hiện tất cả lô","Interactive plot map":"Bản đồ tương tác của lô","The map displays supplied coordinates. It does not verify plot ownership, legality or deforestation.":"Bản đồ hiển thị tọa độ được cung cấp. Chưa xác minh quyền sở hữu, tính hợp pháp hay tình trạng mất rừng.","Open GeoJSON":"Mở file GeoJSON","Choose .geojson or .json · up to 2 MB":"Chọn .geojson hoặc .json · tối đa 2 MB","Plot in file":"Chọn lô trong file","I confirm this closed LineString is the boundary of a plot. Use a Polygon for registration; keep the original file unchanged.":"Tôi xác nhận đường LineString khép kín này là ranh giới lô. Dùng Polygon để đăng ký; giữ nguyên nội dung file gốc.","Save original to geolocation evidence task":"Lưu file gốc vào mục chứng từ tọa độ","New evidence task name":"Tên mục chứng từ mới","Save original GeoJSON":"Lưu file GeoJSON gốc","Upload preserves the original file contents. Evidence approval and plot registration are separate steps.":"Upload giữ nguyên nội dung file gốc. Duyệt chứng từ và đăng ký lô là các bước riêng.","Select a plot / producer relationship":"Chọn quan hệ lô / đơn vị khai thác","Add a Plot, Producer or Forest owner relationship in the supply chain before registering. You can still preview the file.":"Thêm quan hệ Plot, Producer hoặc Forest owner trong chuỗi cung ứng trước khi đăng ký. Bạn vẫn có thể xem trước file.","Advanced: geometry JSON":"Nâng cao: dữ liệu hình học JSON","Preview geometry":"Xem trước tọa độ","Enter country, area, dates and source precision from evidence; these are not inferred from the map.":"Nhập quốc gia, diện tích, thời gian và độ chính xác theo chứng từ; hệ thống không suy ra từ bản đồ.","Registered plots":"Các lô đã đăng ký","Show plot":"Hiện lô này","No plots registered yet.":"Chưa có lô được đăng ký.","Select source evidence":"Chọn chứng từ nguồn","Select evidence task":"Chọn mục chứng từ","Replace draft version":"Thay phiên bản nháp hiện tại","Create a new GeoJSON evidence task":"Tạo mục chứng từ GeoJSON mới","Background map unavailable. Plot geometry remains visible.":"Chưa tải được nền bản đồ. Ranh giới và tọa độ lô vẫn hiển thị.","Interactive map unavailable. Coordinates and registration remain available.":"Chưa mở được bản đồ tương tác. Vẫn có thể xem tọa độ và đăng ký lô.","LineString is a line. Confirm a closed plot boundary to register it as Polygon.":"LineString là đường. Chỉ xác nhận chuyển thành Polygon khi đường đã khép kín và đúng ranh giới lô.","Preview only. Multi-geometries and polygon holes require specialist review before registration.":"Chỉ xem trước. Hình học nhiều phần hoặc polygon có lỗ cần chuyên viên kiểm tra trước khi đăng ký.","Geometry ready for review.":"Tọa độ sẵn sàng để kiểm tra.","Choose a .geojson or .json file up to 2 MB.":"Chọn file .geojson hoặc .json tối đa 2 MB.","plot(s)":"lô","File previewed locally. It has not been uploaded.":"Đang xem trước file trên máy. File chưa được upload.","Enter an evidence task name.":"Nhập tên mục chứng từ.","Select a geolocation evidence task.":"Chọn mục chứng từ tọa độ.","Original GeoJSON saved. Complete the plot details to register; evidence still needs review.":"Đã lưu GeoJSON gốc. Điền thông tin để đăng ký lô; chứng từ vẫn cần được duyệt.","Save status is uncertain. Check the latest record before retrying.":"Chưa xác nhận được trạng thái lưu. Kiểm tra bản ghi mới nhất trước khi thử lại.","Plot registered · REVIEW_REQUIRED.":"Đã đăng ký lô · CHỜ KIỂM TRA.","GeoJSON must be at most 2 MB.":"GeoJSON được tối đa 2 MB.","This file is not valid JSON.":"File này không phải JSON hợp lệ.","Choose a GeoJSON with 1–100 features.":"Chọn GeoJSON chứa từ 1 đến 100 đối tượng.","Coordinates must be [longitude, latitude] within range.":"Tọa độ phải có dạng [kinh độ, vĩ độ] trong phạm vi hợp lệ.","GeoJSON exceeds 10,000 positions.":"GeoJSON vượt quá 10.000 điểm tọa độ.","The geometry has too few positions.":"Hình học có quá ít điểm tọa độ.","Polygon rings are missing.":"Thiếu vòng ranh giới polygon.","Polygon rings must be closed.":"Vòng ranh giới polygon phải khép kín.","Each feature needs a geometry.":"Mỗi đối tượng cần có dữ liệu hình học.","Geometry is empty.":"Dữ liệu hình học trống.","Unsupported geometry type. Use Point, LineString or Polygon.":"Chưa hỗ trợ loại hình học này. Hãy dùng Point, LineString hoặc Polygon.","Registration supports Point or a single-ring Polygon.":"Chỉ đăng ký Point hoặc Polygon có một vòng ranh giới.","A registered polygon must have at most 2,000 positions.":"Polygon đăng ký được tối đa 2.000 điểm tọa độ.","Polygon has duplicate vertices.":"Polygon có đỉnh bị lặp.","Antimeridian geometry requires specialist review.":"Hình học vượt kinh tuyến đổi ngày cần chuyên viên kiểm tra.","Polygon has zero area.":"Polygon không tạo thành diện tích hợp lệ.","Polygon intersects itself. Check the source file.":"Ranh giới polygon tự giao nhau. Hãy kiểm tra file nguồn.","Cannot read file.":"Không đọc được file.","Geolocation · GeoJSON":"Tọa độ lô · GeoJSON","GeoJSON is a map file. Open it here to view and register plots for this material.":"GeoJSON là file tọa độ bản đồ. Mở tại đây để xem và đăng ký lô cho material này.","Open plot map / GeoJSON":"Mở bản đồ lô / GeoJSON",

  'Customer code':'Mã khách hàng','Shipment Date':'Ngày giao hàng dự kiến','I have checked Customer, Shipment Date, each product, customer PO, quantity and material against the original PDF.':'Tôi đã đối chiếu khách hàng, ngày giao hàng, từng sản phẩm, PO khách hàng, số lượng và vật liệu với PDF gốc.','Customer PO allocations':'Phân bổ PO khách hàng','Customer PO#':'PO khách hàng','Destination':'Điểm nhận hàng','SKU / Product code':'SKU / mã sản phẩm','Add Customer PO':'Thêm PO khách hàng','Extract one product per S/No. with separate customer PO quantities and materials. Review the preview before saving. NON_WOOD is excluded; confirm UNKNOWN.':'Trích một sản phẩm cho mỗi S/No. cùng số lượng phân bổ riêng theo PO khách hàng và vật liệu. Kiểm tra preview trước khi lưu. NON_WOOD được loại trừ; cần xác nhận UNKNOWN.','I have checked each product, customer PO, quantity and material against the original PDF.':'Tôi đã đối chiếu từng sản phẩm, PO khách hàng, số lượng và vật liệu với PDF gốc.',
  'Sync task invitations':'Đồng bộ lời mời Google Calendar','Evidence deadlines for your role. Assigned owners and reviewers receive Google Calendar invitations; they may need to accept an invitation email. Click a date to see its tasks.':'Hạn chứng từ theo vai trò của bạn. Người phụ trách và người rà soát được giao sẽ nhận lời mời Google Calendar; có thể cần chấp nhận email mời. Nhấn vào ngày để xem task.','Task invitations checked. Recipients may need to accept their Google Calendar email invitations.':'Đã kiểm tra lời mời task. Người nhận có thể cần chấp nhận email mời từ Google Calendar.',
  'Removed.':'Đã xóa khỏi danh sách.','Confirm Remove':'Xác nhận xóa','Reason for removal':'Lý do xóa','I have checked the selected record.':'Tôi đã kiểm tra đúng mục cần xóa.',
  'REMOVE_CHILDREN_FIRST':'Hãy xóa các quan hệ con của mục này trước.','REMOVE_HAS_HISTORY':'Quan hệ đã có chứng từ hoặc GEO; không thể xóa lịch sử này.','REMOVE_ASSIGNED_TASKS':'Các task của quan hệ đã được phân công hoặc xử lý; hãy rà soát trước khi xóa.','REMOVE_MATERIAL_LINKED':'Material còn quan hệ, task, chứng từ hoặc GEO; hãy xử lý các liên kết trước.','REMOVE_SUPPLIER_LINKED':'Supplier còn liên kết với quan hệ, chứng từ hoặc User; hãy xử lý các liên kết trước.','REMOVE_USER_ASSIGNED':'Hãy chuyển giao Order, task hoặc upload đang xử lý trước khi xóa User.','REMOVE_USER_LOGIN':'Chưa vô hiệu hóa được tài khoản đăng nhập; User vẫn ở trạng thái tắt, hãy thử lại.','SCHEMA_MISMATCH':'Cấu trúc Sheet chưa được cập nhật; Admin cần chạy migration theo hướng dẫn gói cập nhật.','EXPORT_ORPHANED_EVIDENCE':'Chứng từ thiếu liên kết Material, Relationship hoặc Evidence Type; hãy rà soát trước khi xuất.', 'Excluded evidence with missing links:':'Đã loại chứng từ thiếu liên kết:',
  'Human review':'Người phụ trách rà soát','Review decision':'Quyết định duyệt chứng từ','File actions':'Thao tác tệp',
  VERSION_CONFLICT:'Chứng từ hoặc dữ liệu đã thay đổi. Mở lại chứng từ và rà soát phiên bản hiện hành.',
  'Approve evidence':'Phê duyệt chứng từ','Reject evidence':'Từ chối chứng từ','Request more information':'Yêu cầu bổ sung','Mark as in review':'Bắt đầu rà soát',
  'Confirm approval':'Xác nhận phê duyệt','Confirm rejection':'Xác nhận từ chối','Confirm information request':'Xác nhận yêu cầu bổ sung','Confirm review started':'Xác nhận bắt đầu rà soát',
  'Change review decision':'Đổi quyết định duyệt','Back':'Quay lại','Active version':'Phiên bản hiện hành','Previous version':'Phiên bản cũ',
  'Evidence approval records an internal review. It does not confirm EUDR compliance.':'Phê duyệt này ghi nhận rà soát chứng từ nội bộ; không xác nhận tuân thủ EUDR.',
  'Last reviewed by':'Người rà soát gần nhất','Reason / required changes (required)':'Lý do / nội dung cần sửa (bắt buộc)','Review note (optional)':'Ghi chú rà soát (không bắt buộc)',
  'Decision notes are shared with the supplier and saved in the audit trail.':'Ghi chú quyết định được chia sẻ với nhà cung cấp và lưu trong nhật ký.',
  'Specify the missing information and what the supplier should provide.':'Nêu thông tin còn thiếu và nội dung nhà cung cấp cần bổ sung.',
  'Explain why this version cannot be accepted.':'Nêu lý do phiên bản này chưa được chấp nhận.',
  'Record the checks completed or any relevant observations.':'Ghi các nội dung đã kiểm tra hoặc nhận xét liên quan.',
  'Enter a reason before confirming this decision.':'Nhập lý do trước khi xác nhận quyết định này.','Review decision saved.':'Đã lưu quyết định duyệt chứng từ.',
  'This is a previous version. Review the active version to make a decision.':'Đây là phiên bản cũ. Mở phiên bản hiện hành để đưa ra quyết định.',
  'Review decisions are available to authorized reviewers.':'Chỉ người có quyền rà soát mới được đưa ra quyết định duyệt.',
  'Submit this version for review before making a decision.':'Nộp phiên bản này để rà soát trước khi đưa ra quyết định.',
  'Upload a revised version and submit it for review.':'Tải lên phiên bản đã chỉnh sửa và nộp lại để rà soát.',
  'Add a comment':'Thêm bình luận','Add Comment':'Lưu bình luận','Comment visibility':'Phạm vi bình luận','No comments yet.':'Chưa có bình luận.',
  'SHARED_WITH_SUPPLIER':'Chia sẻ với nhà cung cấp','INTERNAL_ONLY':'Chỉ nội bộ','Submit for review':'Nộp để rà soát','Certificate Metadata':'Thông tin chứng chỉ',
  'Processed copy verification':'Kiểm tra bản xử lý','Verification checks':'Nội dung đã kiểm tra','Verify processed copy':'Xác nhận bản xử lý','Document preview':'Xem trước chứng từ',
  'Price Redaction Prompt':'Prompt che giá','English Subtitle Prompt':'Prompt phụ đề tiếng Anh','Upload Redacted PDF':'Tải bản PDF đã che giá','Upload English Subtitle PDF':'Tải bản PDF phụ đề tiếng Anh',
  'Verify your email':'Xác minh email','Send verification email':'Gửi email xác minh','I have verified my email':'Tôi đã xác minh email','Back to sign in':'Quay lại đăng nhập',
  'Your password was accepted. Verify your email before opening the workspace.':'Mật khẩu đã được chấp nhận. Hãy xác minh email trước khi vào workspace.',
  'Verification email sent. Open the link in your inbox, then return here.':'Đã gửi email xác minh. Mở liên kết trong hộp thư, sau đó quay lại đây.',
  'Could not send the verification email. Try again or sign in again.':'Chưa gửi được email xác minh. Hãy thử lại hoặc đăng nhập lại.',
  'Your email is not verified yet. Open the verification link first.':'Email chưa được xác minh. Hãy mở liên kết xác minh trong hộp thư trước.',
  AUTH_EMAIL_UNVERIFIED:'Hãy xác minh email trước khi đăng nhập.',
  AUTH_TOKEN_EXPIRED:'Phiên đã hết hạn. Hãy đăng nhập lại.',
  AUTH_TOKEN_REVOKED:'Phiên đã bị thu hồi. Hãy đăng nhập lại bằng mật khẩu hiện tại.',
  AUTH_TOKEN_INVALID:'Phiên đăng nhập không hợp lệ cho Firebase project này. Hãy đăng nhập lại.',
  AUTH_ACCOUNT_DISABLED:'Tài khoản Firebase bị vô hiệu hóa. Liên hệ quản trị.',
  FIREBASE_CONFIG_INVALID:'Cấu hình Firebase trên máy chủ không hợp lệ. Quản trị cần kiểm tra FIREBASE_SERVICE_ACCOUNT_JSON và FIREBASE_PROJECT_ID.',
  FIREBASE_PERMISSION_DENIED:'Service account chưa có quyền Firebase Authentication. Liên hệ quản trị.',
  FIREBASE_UNAVAILABLE:'Chưa kết nối được dịch vụ xác thực Firebase. Hãy thử lại.',
  'Operations':'Vận hành','Workspace':'Workspace','Secure access':'Truy cập bảo mật','Order workspace':'Workspace đơn hàng','Sign out':'Đăng xuất','Close':'Đóng',
  'Dashboard':'Tổng quan','Orders':'Đơn hàng','My Tasks':'Công việc của tôi','Calendar':'Lịch','AI Assistant':'Trợ lý AI','Export':'Xuất hồ sơ','Audit Trail':'Nhật ký kiểm toán','Suppliers':'Nhà cung cấp','Users':'Người dùng','Settings':'Cài đặt',
  'Your evidence workspace':'Workspace hồ sơ của bạn','Username / Email':'Tên đăng nhập / Email','Password':'Mật khẩu','Sign In':'Đăng nhập','Forgot Password?':'Quên mật khẩu?','Reset password':'Đặt lại mật khẩu','Change Your Password':'Đổi mật khẩu','New password':'Mật khẩu mới','Confirm new password':'Xác nhận mật khẩu mới','Change password':'Đổi mật khẩu','At least 12 characters.':'Ít nhất 12 ký tự.','Access follows your assigned orders and role.':'Quyền truy cập phụ thuộc vào vai trò và đơn hàng được phân công.',
  'New Order':'Đơn hàng mới','Order No.':'Số đơn hàng','Customer':'Khách hàng','Product':'Sản phẩm','Customer PO':'PO khách hàng','Evidence due date':'Hạn nộp hồ sơ','Sales Order PDF':'Sales Order PDF','Product image (optional)':'Hình sản phẩm (không bắt buộc)','Create Order':'Tạo đơn hàng','Creating order':'Đang tạo đơn hàng','We are validating the information, uploading the files and preparing the order workspace.':'Hệ thống đang kiểm tra thông tin, tải tệp lên và chuẩn bị workspace cho đơn hàng.','Validating information':'Đang kiểm tra thông tin','Uploading Sales Order':'Đang tải Sales Order','Preparing Drive folders':'Đang chuẩn bị thư mục Drive','Registering order':'Đang ghi nhận đơn hàng','Finalising workspace':'Đang hoàn tất workspace','Order created successfully':'Tạo đơn hàng thành công','Open Order Workspace':'Mở Workspace đơn hàng','Upload More Files':'Tải thêm tài liệu','Create Another Order':'Tạo đơn hàng khác','Retry':'Thử lại','Order creation failed':'Không thể tạo đơn hàng','Keep this window open while the request completes.':'Vui lòng giữ cửa sổ này mở cho đến khi hoàn tất.',
  'Order':'Đơn hàng','Source file':'Tệp nguồn','Order folder':'Thư mục đơn hàng','Read tabs':'Tab cần đọc','Target tab':'Tab đích','Mode':'Chế độ','Human review required':'Cần người rà soát','Open Order Folder':'Mở thư mục đơn hàng','Open Source File':'Mở tệp nguồn','Open System Sheet':'Mở Sheet hệ thống','Copy Prompt':'Sao chép prompt','Open ChatGPT':'Mở ChatGPT','Generate Prompt':'Tạo prompt','Function':'Chức năng','Document':'Tài liệu','Structured result JSON':'Kết quả JSON có cấu trúc','Import AI Result':'Nhập kết quả AI',
  'Global search':'Tìm kiếm','Stage':'Giai đoạn','Supplier':'Nhà cung cấp','Assigned user':'Người phụ trách','Material':'Vật liệu','Evidence block':'Nhóm hồ sơ','Due status':'Tình trạng hạn','Created from':'Tạo từ','Created to':'Tạo đến','Apply filters':'Áp dụng bộ lọc','Clear':'Xóa','All':'Tất cả',
  'View':'Xem','Upload':'Tải lên','Assign':'Phân công','Edit':'Chỉnh sửa','Add User':'Thêm người dùng','Add Supplier':'Thêm nhà cung cấp','Save User':'Lưu người dùng','Save Supplier':'Lưu nhà cung cấp','Save Settings':'Lưu cài đặt','Download':'Tải xuống','Previous':'Trước','Next':'Tiếp','Month':'Tháng','Week':'Tuần','List':'Danh sách','Overdue':'Quá hạn','Due Today':'Đến hạn hôm nay','Due This Week':'Đến hạn tuần này','Awaiting My Review':'Chờ tôi rà soát','Waiting for Supplier':'Chờ nhà cung cấp','Completed':'Đã hoàn tất',
  'Evidence readiness supports human review. It is not a regulatory decision.':'Mức độ sẵn sàng của hồ sơ hỗ trợ người rà soát; đây không phải quyết định pháp lý.',
  'Structured evidence for traceable and accountable review':'Hồ sơ có cấu trúc cho quy trình truy xuất và rà soát có trách nhiệm',
  'Evidence control center':'Trung tâm quản lý hồ sơ','Needs attention':'Cần xử lý','Recent orders':'Đơn hàng gần đây','Notifications':'Thông báo','No orders found':'Không tìm thấy đơn hàng','No orders registered yet':'Chưa có đơn hàng','No urgent tasks':'Không có việc khẩn cấp',
  'Assignment':'Phân công','Certificate metadata':'Thông tin chứng chỉ','Close internal evidence workflow':'Đóng quy trình hồ sơ nội bộ','Export Center':'Trung tâm xuất hồ sơ','GEO review':'Rà soát tọa độ','Materials · human confirmation':'Vật liệu · xác nhận của người phụ trách','Settings · Legal freshness':'Cài đặt · hiệu lực pháp lý','Supply Chain':'Chuỗi cung ứng','Temporary password':'Mật khẩu tạm thời','User access':'Quyền người dùng','Workspace context':'Ngữ cảnh workspace','Required items approved':'Chứng từ bắt buộc đã duyệt','Visible to your role':'Theo quyền truy cập của bạn',
  'All assigned evidence':'Tất cả hồ sơ được phân công','Comments':'Bình luận','Processed copies':'Bản xử lý','Production country risk':'Rủi ro quốc gia sản xuất','Register plot':'Ghi nhận lô đất','Version history':'Lịch sử phiên bản','Advanced filters':'Bộ lọc nâng cao','Assigned Orders':'Đơn hàng được phân công','Select evidence':'Chọn hồ sơ',
  'Action':'Thao tác','Actions':'Thao tác','Active':'Đang hoạt động','Actor':'Người thực hiện','Category':'Loại','Change':'Thay đổi','Name / Email':'Tên / Email','Order / Evidence':'Đơn hàng / Hồ sơ','Order / Object':'Đơn hàng / Đối tượng','Owner / Due':'Phụ trách / Hạn','Role':'Vai trò','Scientific name':'Tên khoa học','Source':'Nguồn','Status':'Trạng thái','Time':'Thời gian',
  'Add relationship':'Thêm liên kết','Confirm Internal Closure':'Xác nhận đóng nội bộ','Confirm Materials & Create Folders':'Xác nhận vật liệu và tạo thư mục','Full Package':'Toàn bộ hồ sơ','Record Human Review':'Ghi nhận rà soát của người phụ trách','Record review':'Ghi nhận rà soát','Record verified fields':'Ghi nhận trường đã kiểm tra','Save assignment':'Lưu phân công','Save source-backed information':'Lưu thông tin có nguồn','Selected Package':'Hồ sơ đã chọn','Validate & Preview':'Kiểm tra và xem trước','Validate & Register':'Kiểm tra và ghi nhận',
  'Provision Login':'Cấp tài khoản','Temporary password':'Mật khẩu tạm thời','First login requires a password change.':'Lần đăng nhập đầu tiên cần đổi mật khẩu.','Passwords do not match.':'Mật khẩu xác nhận không khớp.','Password changed. Sign in with your new password.':'Đã đổi mật khẩu. Hãy đăng nhập bằng mật khẩu mới.','If this account exists, a password reset message will be sent.':'Nếu tài khoản tồn tại, hệ thống sẽ gửi hướng dẫn đặt lại mật khẩu.','has been created and the Sales Order has been registered.':'đã được tạo và Sales Order đã được ghi nhận.','Confirm materials and evidence requirements before uploading files.':'Xác nhận vật liệu và yêu cầu hồ sơ trước khi tải tệp lên.','Existing order folder found. Review and select the correct folder before creating this order.':'Đã tìm thấy thư mục liên quan. Hãy kiểm tra và chọn đúng thư mục trước khi tạo đơn.','Choose existing folder':'Chọn thư mục có sẵn',
  'Upload the processed derivative through the approved source document workflow after human verification.':'Tải bản xử lý qua quy trình của tài liệu gốc sau khi người phụ trách kiểm tra.','Generated prompt':'Prompt đã tạo','Open exact linked files in ChatGPT Work if connected; otherwise attach them. Links alone are not file access.':'Mở đúng tệp được liên kết nếu ChatGPT Work đã kết nối Drive; nếu chưa, hãy đính kèm tệp. Chỉ có liên kết không đồng nghĩa với quyền đọc tệp.',
  'Select a file of up to 3 MB':'Chọn tệp không quá 3 MB.','Cannot read file':'Không thể đọc tệp.','Saved.':'Đã lưu.','Saving…':'Đang lưu…','Copied.':'Đã sao chép.','Authentication required':'Cần đăng nhập.','NOT_STARTED':'Chưa bắt đầu','COLLECTING_EVIDENCE':'Đang thu thập hồ sơ','IN_REVIEW':'Đang rà soát','READY_FOR_OPERATOR_REVIEW':'Sẵn sàng cho người phụ trách rà soát','ACTION_REQUIRED':'Cần xử lý','CLOSED':'Đã đóng','MISSING':'Thiếu','UPLOADED':'Đã tải lên','SUBMITTED':'Đã nộp','APPROVED':'Đã duyệt nội bộ','REJECTED':'Bị từ chối','MORE_INFO_REQUIRED':'Cần bổ sung','NOT_VERIFIABLE':'Không thể kiểm chứng','WARNING':'Cảnh báo','MISMATCH':'Không khớp','PASS':'Đạt tiêu chí đã kiểm tra',
  'INVALID_INPUT':'Thông tin không hợp lệ. Kiểm tra các trường và thử lại.','INVALID_FILE':'Tệp không hợp lệ. Vui lòng chọn PDF phù hợp.','DUPLICATE_ORDER':'Đơn hàng đã tồn tại. Mở đơn hàng hiện có.','EXISTING_FOLDER_REVIEW_REQUIRED':'Hãy chọn thư mục đơn hàng có sẵn sau khi kiểm tra.','REQUEST_TOO_LARGE':'Yêu cầu vượt giới hạn dung lượng.','PERMISSION_DENIED':'Bạn không có quyền thực hiện thao tác này.','AUTH_REQUIRED':'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.','PASSWORD_CHANGE_REQUIRED':'Vui lòng đổi mật khẩu trước khi vào workspace.','UPSTREAM_UNAVAILABLE':'Không thể kết nối hệ thống. Thử lại với cùng yêu cầu.','CONFIG_REQUIRED':'Hệ thống chưa được cấu hình. Liên hệ quản trị.','AUTH_FAILED':'Không thể đăng nhập. Kiểm tra thông tin và thử lại.','WEAK_PASSWORD':'Mật khẩu cần có ít nhất 12 ký tự.','ACCOUNT_EXISTS':'Tài khoản đã được tạo.','FILE_TOO_LARGE':'Tệp vượt giới hạn dung lượng.'
 }
};
Object.assign(translations.vi,{
 'Refresh answers':'Làm mới câu trả lời',
 'Retry scheduled':'Đang chờ thử lại',
 'The AI service is busy. This question will retry automatically. Refresh answers in a minute.':'Dịch vụ AI đang bận. Hệ thống sẽ tự thử lại câu hỏi này; hãy làm mới câu trả lời sau ít phút.',
 'The AI cited a source outside the available PDF pages or Order records. The answer was rejected; ask again after this update.':'AI trích dẫn trang PDF hoặc dòng dữ liệu không có trong phạm vi được phép. Hệ thống đã từ chối câu trả lời; hãy hỏi lại sau khi cập nhật bản này.',
 'The AI provider was temporarily unavailable. Please ask again later.':'Dịch vụ AI tạm thời không phản hồi. Vui lòng hỏi lại sau.',
 'Order sections':'Các mục của đơn hàng','Evidence workspace':'Chứng từ & vật liệu','Select a saved answer or ask a question.':'Chọn câu trả lời đã lưu hoặc đặt câu hỏi mới.',
 'No PDF is linked to this material or PO/lot. The Order has registered PDFs.':'Chưa có PDF liên kết với vật liệu hoặc PO/lô này. Đơn hàng có PDF đã đăng ký.','No registered PDF is linked to this material or PO/lot.':'Chưa có PDF đã đăng ký liên kết với vật liệu hoặc PO/lô này.','No registered PDF is available in this Order. PDFs stored only in Drive folders must first be linked to the Order.':'Đơn hàng chưa có PDF nào được đăng ký để AI đọc. PDF chỉ nằm trong thư mục Drive cần được liên kết vào đơn hàng trước.','Use Whole Order PDFs':'Dùng PDF của toàn đơn hàng',
 'Ask KODA AI':'Hỏi KODA AI','Answers use this Order, its registered PDF documents and the selected material. Each PDF must be indexed before asking.':'Câu trả lời dùng dữ liệu của đơn hàng, PDF đã đăng ký và vật liệu được chọn. Hãy lập chỉ mục PDF trước khi hỏi.',
 'Scope':'Phạm vi','Whole Order':'Toàn bộ đơn hàng','Selected material':'Vật liệu đang chọn','Selected PO / lot':'PO / lô đang chọn','indexed':'đã lập chỉ mục','need indexing':'cần lập chỉ mục','PDFs needing OCR':'PDF cần OCR','Index PDFs from Drive':'Lập chỉ mục PDF từ Drive',
 'Your question':'Câu hỏi của bạn','Ask':'Gửi câu hỏi','Recent answers':'Câu trả lời gần đây','Answer':'Câu trả lời','Human verification remains required.':'Cần người phụ trách xác minh.','Refresh this answer after the AI worker completes.':'Làm mới câu trả lời sau khi AI xử lý.','Index complete. Ask a question.':'Đã lập chỉ mục. Bạn có thể đặt câu hỏi.','Question queued. You may return later to view the answer.':'Đã xếp lượt câu hỏi. Bạn có thể quay lại xem kết quả.',
 'Organize document groups':'Tự phân nhóm chứng từ','Organizing':'Đang phân nhóm','draft document groups saved':'nhóm chứng từ nháp đã lưu','uncertain groups need review':'nhóm chưa chắc chắn cần kiểm tra','Proposed supply chain':'Chuỗi cung ứng AI đề xuất','cited transactions':'giao dịch có trích dẫn','Review each branch before saving.':'Kiểm tra từng nhánh trước khi lưu.','Review and create supply chain':'Kiểm tra và tạo chuỗi cung ứng','Review proposed supply chain':'Kiểm tra chuỗi AI đề xuất','Supplier transactions':'Giao dịch giữa các supplier','I checked these suppliers and transactions against the original PDFs. Create draft links for this material and source.':'Tôi đã đối chiếu supplier và giao dịch với PDF gốc. Tạo liên kết nháp cho vật liệu và nguồn này.','Create draft supply chain':'Tạo chuỗi cung ứng nháp','Draft supply chain saved. Verify lot, quantities, origin and GEO.':'Đã lưu chuỗi nháp. Cần kiểm tra lô, số lượng, nguồn gốc và GEO.',
 'Review proposed document groups':'Xem nhóm chứng từ AI đề xuất','Classify pages manually':'Phân loại trang thủ công','AI suggests page ranges and document types. Check the original PDF before confirming draft copies.':'AI đề xuất khoảng trang và loại chứng từ. Đối chiếu PDF gốc trước khi xác nhận tạo bản nháp.','I checked the original PDF pages and confirm the selected ranges and evidence blocks.':'Tôi đã đối chiếu PDF gốc và xác nhận khoảng trang, nhóm chứng từ được chọn.','Create selected draft PDFs':'Tạo PDF nháp đã chọn','Unselected or uncertain pages remain in the original PDF for manual review.':'Trang chưa chọn hoặc chưa chắc chắn vẫn nằm trong PDF gốc để kiểm tra thêm.','Unreadable pages need manual review.':'Trang khó đọc cần kiểm tra thủ công.','Draft already saved':'Đã lưu bản nháp','Select and confirm at least one proposed section.':'Chọn và xác nhận ít nhất một nhóm chứng từ đề xuất.','Uncertain pages require manual classification.':'Trang chưa chắc chắn cần phân loại thủ công.'
});
let language=localStorage.getItem('eudr_language')||'en';
if(!['en','vi'].includes(language))language='en';
const originalText=new WeakMap();
function t(key,variables={}){let value=language==='vi'&&v27Vietnamese.has(key)?key:translations[language][key]||translations.en[key]||key;return value.replace(/\{(\w+)\}/g,(_,k)=>String(variables[k]??''));}
function translateUI(root=document){
 document.documentElement.lang=language;
 root.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=t(el.dataset.i18n)});
 // Translate fixed labels even when a label contains an input, link or value.
 // Exact dictionary matches leave document names, evidence, and user text intact.
 root.querySelectorAll('button,h1,h2,h3,h4,h5,th,legend,option,summary,a,label,p,small,strong,span[data-i18n-fragments],li[data-i18n-fragments],.sidebar-section,.badge,.status-pill').forEach(el=>{
  if(el.dataset.i18n||el.closest('[data-i18n-source]'))return;
  for(const node of el.childNodes){
   if(node.nodeType!==Node.TEXT_NODE)continue;
   const original=originalText.get(node)||node.textContent.trim();
   if(!Object.hasOwn(translations.vi,original)&&!Object.hasOwn(translations.en,original)&&!el.hasAttribute('data-i18n-fragments'))continue;
   originalText.set(node,original);
   const exact=Object.hasOwn(translations.vi,original)||Object.hasOwn(translations.en,original);
   node.textContent=node.textContent.replace(node.textContent.trim(),exact?t(original):translateFragments(original));
  }
 });
 root.querySelectorAll('input[placeholder]').forEach(el=>{const original=el.dataset.i18nPlaceholder||el.placeholder;el.dataset.i18nPlaceholder=original;el.placeholder=t(original)});
 const select=document.getElementById('language');if(select)select.value=language;
}
function setLanguage(next){if(!['en','vi'].includes(next))return;language=next;localStorage.setItem('eudr_language',next);translateUI();}
window.EudrI18n={t,translateUI,setLanguage,get language(){return language}};

Object.assign(translations.vi,{'Edit Order':'Sửa đơn hàng','Products':'Sản phẩm','Materials':'Vật liệu','+ Add Product':'+ Thêm sản phẩm','Optional product image':'Hình sản phẩm (không bắt buộc)','Maximum file size: 3 MB':'Dung lượng tối đa: 3 MB','AI Review Outputs':'Kết quả kiểm tra AI','Evidence policy':'Quy định chứng từ','Repair Sales Order review':'Khôi phục bước duyệt Sales Order','Import / Add Material':'Nhập / Thêm vật liệu','Edit Material / PO':'Sửa vật liệu / PO','Remove draft':'Gỡ bản nháp','Select Existing Supplier':'Chọn nhà cung cấp có sẵn','Create New Supplier':'Tạo nhà cung cấp mới','Final producer in this branch':'Đơn vị sản xuất cuối nhánh','Order → Product → Material → Supplier Chain → Evidence':'Đơn hàng → Sản phẩm → Vật liệu → Chuỗi cung ứng → Chứng từ','MATERIAL_EDIT':'Cập nhật vật liệu','Quantity':'Số lượng','UOM':'Đơn vị tính','Material PO (optional)':'PO vật liệu (không bắt buộc)','Source reference':'Tham chiếu nguồn','Add Material':'Thêm vật liệu','Save':'Lưu','Remove':'Gỡ','Capabilities':'Quyền nghiệp vụ','HUMAN_MAPPING_REQUIRED':'Cần người phụ trách kiểm tra và chọn bản ghi phù hợp.','OUTPUT_SIZE_BLOCKED':'File không đạt giới hạn dưới 3 MB; cần xử lý thủ công.','FEATURE_DISABLED':'Tính năng đã tắt. Vui lòng dùng quy trình MP.'});
Object.assign(translations.vi,{
 'Review & Complete Dossier':'Kiểm tra & hoàn tất hồ sơ','Final dossier check':'Kiểm tra toàn bộ hồ sơ ở bước cuối.','Items to resolve':'Nội dung cần xử lý','All internal checks are ready for human review.':'Các bước kiểm tra nội bộ đã sẵn sàng để người phụ trách xác nhận.','Human review notes':'Ghi chú rà soát','View AI Results':'Xem kết quả AI','No evidence assigned in this block.':'Chưa có chứng từ trong nhóm này.','No products recorded.':'Chưa ghi nhận sản phẩm.','Open the final check when document collection and review are ready.':'Mở bước kiểm tra cuối sau khi thu thập và rà soát chứng từ.','Maximum file size: less than 3 MB':'Dung lượng tệp phải nhỏ hơn 3 MB.','FILE_TOO_LARGE':'Tệp phải nhỏ hơn 3 MB.','OVERDUE':'Quá hạn','NOT_REQUIRED':'Không yêu cầu',
 'MISSING_MATERIAL':'Chưa có vật liệu','MISSING_EVIDENCE':'Chưa có yêu cầu chứng từ','EVIDENCE_NOT_APPROVED':'Chứng từ chưa được phê duyệt','AI_REVIEW_REQUIRED':'Cần rà soát kết quả AI','LEGAL_REVIEW_DUE':'Cần rà soát cơ sở pháp lý','EXPIRED_CERTIFICATE':'Chứng từ đã hết hạn','EXPORT_REQUIRED':'Cần xuất bộ hồ sơ',
 'UPSTREAM_CHAIN_MISSING':'Thiếu chuỗi cung ứng','SCIENTIFIC_SPECIES_NOT_PROVIDED':'Chưa có tên khoa học của loài gỗ','PRODUCT_SCOPE_REVIEW_REQUIRED':'Cần rà soát phạm vi sản phẩm','MATERIAL_QUANTITY_NOT_PROVIDED':'Chưa có số lượng vật liệu','PRODUCTION_COUNTRY_NOT_PROVIDED':'Chưa có quốc gia sản xuất','PRODUCTION_RANGE_NOT_PROVIDED':'Chưa có thời gian sản xuất','LEGALITY_EVIDENCE_IDS_MISSING':'Thiếu chứng từ tính hợp pháp','DEFORESTATION_EVIDENCE_IDS_MISSING':'Thiếu chứng từ về không phá rừng','SCOPE_VERSION_REVIEW_REQUIRED':'Cần rà soát phiên bản phạm vi sản phẩm'
});
Object.assign(translations.vi,{'Requirement':'Yêu cầu','Add Evidence Type':'Thêm loại chứng từ','Order / Tier Requirement':'Yêu cầu theo đơn hàng / tầng','Add Order / Tier Evidence':'Thêm chứng từ theo đơn hàng / tầng','Tier / relationship':'Tầng / quan hệ','Material level':'Cấp vật liệu','Evidence Type':'Loại chứng từ','Reason':'Lý do','Save scoped decision':'Lưu quyết định riêng','Add scoped evidence':'Thêm chứng từ riêng','REQUIRED':'Bắt buộc','OPTIONAL':'Tùy chọn'});
Object.assign(translations.vi,{'UPSTREAM_HTTP':'Apps Script trả về lỗi HTTP. Vui lòng kiểm tra trạng thái dữ liệu và mã tham chiếu.','UPSTREAM_NON_JSON':'Apps Script không trả về dữ liệu JSON. Cần kiểm tra bản triển khai và quyền truy cập.','UPSTREAM_FORMAT':'Phản hồi từ máy chủ không đúng định dạng. Cần kiểm tra phiên bản triển khai.','UPSTREAM_TIMEOUT':'Apps Script phản hồi quá chậm. Vui lòng kiểm tra dữ liệu trước khi thử lại.','UPSTREAM_UNAVAILABLE':'Không kết nối được Apps Script. Vui lòng kiểm tra dữ liệu trước khi thử lại.','NETWORK_ERROR':'Kết nối bị gián đoạn. Vui lòng kiểm tra dữ liệu trước khi thử lại.','Save status is uncertain. Check the latest record before retrying; this form remains open.':'Chưa xác định thao tác đã lưu hay chưa. Hãy kiểm tra bản ghi mới nhất trước khi thử lại; biểu mẫu vẫn được giữ.'});
Object.assign(translations.vi,{'Loading PDF preview…':'Đang tải bản xem PDF…','PDF_PREVIEW_UNAVAILABLE':'Không thể xem trước PDF trong trình duyệt. Hãy tải bản gốc để kiểm tra.','PDF preview unavailable. Use Download to inspect the original.':'Không thể xem trước PDF. Hãy dùng nút Tải xuống để kiểm tra bản gốc.'});
Object.assign(translations.vi,{
  'Products':'Sản phẩm','Materials':'Vật liệu','Supply Chain':'Chuỗi cung ứng','+ Add Materials':'+ Thêm vật liệu','+ Add Relationship':'+ Thêm quan hệ','Add Relationship':'Thêm quan hệ','Edit Relationship':'Sửa quan hệ','More product actions':'Thao tác sản phẩm khác','More material actions':'Thao tác vật liệu khác','More relationship actions':'Thao tác quan hệ khác','No upstream relationship yet for this material.':'Chưa có quan hệ nhà cung cấp cho vật liệu này.','Select or add a material to begin the Supply Chain.':'Chọn hoặc thêm vật liệu để bắt đầu chuỗi cung ứng.',
 'Commercial Shipping':'Thương mại & vận chuyển','FSC Certification':'Chứng nhận FSC','Transport':'Vận chuyển','Geolocation':'Vị trí địa lý',
 'Evidence needs block mapping':'Chứng từ cần phân loại vào khối','Original approved documents':'Chứng từ gốc đã duyệt','AI processed copies':'Bản xử lý bằng AI','Export package':'Xuất bộ chứng từ','Exporting ZIP…':'Đang tạo tệp ZIP…','ZIP is ready.':'Tệp ZIP đã sẵn sàng.','Download ZIP':'Tải ZIP','Export failed.':'Xuất bộ chứng từ thất bại.','Select at least one approved document.':'Chọn ít nhất một chứng từ đã duyệt.',
 'EVIDENCE_BLOCK_REQUIRED':'Cần phân loại chứng từ cũ vào một trong bốn khối trước khi tải lên.'
});
Object.assign(translations.vi,{
 'Orders to export':'Đơn hàng cần xuất','Export packages':'Xuất các bộ chứng từ','Select at least one order.':'Chọn ít nhất một đơn hàng.',
 'Select at least one approved document for each order.':'Chọn ít nhất một chứng từ đã duyệt cho từng đơn hàng.',
 'Choose one or more orders. Each order gets its own ZIP in its Drive export folder, with a separate download button. Approved originals and human-verified AI copies are shown separately.':'Chọn một hoặc nhiều đơn hàng. Mỗi đơn hàng có một tệp ZIP trong thư mục xuất của đơn hàng và một nút tải riêng. Chứng từ gốc đã duyệt và bản AI được người phụ trách xác minh hiển thị riêng.',
 'Packages above 3 MB download in checked chunks without leaving this page.':'Có thể tải các gói trên 3 MB theo từng phần ngay tại trang này.'
});

// V2.7 workspace and drawer labels. The English text is canonical for both
// languages; legacy Vietnamese literals are mapped back for older templates.
const v27Labels={
 'Product · Material · PO / lot':'Sản phẩm · Vật liệu · PO / lô',
 'PO / lot source':'Nguồn PO / lô','Legacy Order checks':'Kiểm tra Order phiên bản trước',
 'This imported product contains only NON_WOOD materials.':'Product chỉ có NON_WOOD theo bản import đã xác nhận.',
 'No material is linked to this product. Confirm its source in Product · Material · PO / lot.':'Chưa có material gắn với product này. Xác nhận liên kết trong Product · Material · PO / lot.',
 'No source has been allocated to this product.':'Nguồn chưa được phân bổ cho product này.',
 'Review multiple PDFs by material and PO/lot source. Refresh results from Drive for findings, references and next actions.':'Kiểm tra nhiều PDF theo material và nguồn PO/lô. Refresh results from Drive để lấy nhận xét, dẫn chứng và next actions.',
 'Keep documents, GEO and history; stop tracking this material.':'Giữ nguyên chứng từ, GEO và lịch sử; ngừng theo dõi material này.',
 'Remove this mistaken material and its unused automatic tasks. Keep the folder.':'Xóa material nhập nhầm cùng các task tự tạo chưa có hoạt động. Folder được giữ lại.',
 'No business links.':'Không có liên kết nghiệp vụ.','Reason':'Lý do','I confirm this action.':'Tôi xác nhận phương án trên',
 'Customer PO/SKU is separate from a material purchase PO. Create a separate source for each distinct PO/lot and link only verified records.':'Customer PO/SKU không phải PO mua nguyên liệu. Hai PO/lô khác nhau phải tạo hai nguồn riêng. Chỉ liên kết dữ liệu có căn cứ.',
 'PO/lot source':'Nguồn PO/lô','No source yet':'Chưa có nguồn','Unknown PO':'PO chưa rõ',
 '+ Add material source':'+ Tạo nguồn material','Unknown supplier':'Chưa xác định',
 'Harvest country (ISO 2: VN, US…)':'Quốc gia khai thác (ISO 2: VN, US…)',
 'Harvest start':'Bắt đầu khai thác','Harvest end':'Kết thúc khai thác','Create separate source':'Tạo nguồn riêng',
 'Allocate source to product':'Phân bổ nguồn cho product','Quantity unknown':'Quantity chưa rõ',
 'No product is allocated to this source.':'Chưa xác định product sử dụng nguồn này.',
 'Quantity used':'Quantity sử dụng','Save allocation':'Lưu phân bổ',
 'Transactions for this source':'Chuỗi giao dịch theo nguồn',
 'Flow: upstream → downstream → KODA. A supplier may appear in multiple branches and lots.':'Chiều giao dịch: upstream → downstream → KODA. Một supplier có thể xuất hiện ở nhiều nhánh/lô.',
 'Missing INV/transaction':'thiếu INV/transaction','No source transactions yet.':'Chưa có giao dịch nguồn.',
 'Unverified points':'Các điểm chưa xác minh','Node name':'Tên node','Type':'Loại',
 'This is a forest source / terminal origin':'Đây là nguồn rừng / terminal origin',
 'Add node':'Thêm node','+ Upstream → downstream transaction':'+ Giao dịch upstream → downstream',
 'Upstream lot':'Lot tại upstream','Downstream lot':'Lot tại downstream',
 'Supporting transaction documents':'Chứng từ giao dịch có căn cứ','Add transaction':'Thêm giao dịch',
 'Link documents, GEO and tasks to the correct PO/lot':'Gắn chứng từ, GEO, task vào đúng PO/lô',
 'Unlinked records cannot establish completeness for this source.':'Các record chưa gắn nguồn không được dùng để kết luận bộ hồ sơ của nguồn này đã đủ.',
 'I verified this record belongs to this PO/lot':'Tôi đã kiểm tra record thuộc PO/lô này','Link source':'Gắn nguồn',
 'Reason for removing the product/source allocation':'Lý do bỏ phân bổ product/nguồn',
 'Reason for deactivating this transaction; history is retained':'Lý do ngừng dùng giao dịch này; lịch sử được giữ',
 'Select multiple PDFs for one material source. Results are stored in Drive; use Refresh results from Drive to view them.':'Chọn nhiều PDF cho một nguồn material. Kết quả được lưu ở Drive; dùng Refresh results from Drive để xem lại.',
 'Source not identified':'Chưa xác định nguồn',
 'Create a source and allocate a product in Product · Material · PO / lot before reviewing.':'Tạo nguồn và phân bổ product trong Product · Material · PO / lot trước khi đánh giá.',
 'Harvest country unknown':'Quốc gia khai thác chưa rõ','Source documents':'Chứng từ của nguồn',
 'Upload multiple PDFs · up to 100 MB each':'Upload nhiều PDF · tối đa 100 MB/file',
 'Upload to this source':'Upload vào nguồn này',
 'Select all PDFs to review together (maximum 20)':'Chọn toàn bộ file cần đối chiếu chung (tối đa 20)',
 'Linked to task':'đã gắn task','Not linked to task':'chưa gắn task',
 'Link PDF to evidence task':'Gắn PDF vào evidence task','No PDFs linked to this source.':'Chưa có PDF gắn đúng nguồn.',
 'PDFs are not linked to a PO/lot. Link the source in Product · Material · PO / lot before reviewing.':'PDF chưa gắn PO/lô. Gắn nguồn trong Product · Material · PO / lot để đưa vào đánh giá.',
 'Run OCR on all pages if the text layer is unreliable':'OCR lại toàn bộ trang khi text layer không đáng tin',
 'Run OCR + AI across selected PDFs':'Chạy OCR + AI đối chiếu nhiều file',
 'Prompt for ChatGPT review':'Prompt để kiểm tra bằng ChatGPT',
 'Create a prompt for the source and selected PDFs':'Tạo prompt theo nguồn và các PDF đã chọn',
 'Stop OCR / pause upload':'Dừng OCR / pause upload',
 'AI runs in the background; you can close this window once queued. Reviewing multiple PDFs uses one AI request.':'AI chạy nền, có thể đóng cửa sổ sau khi đã xếp lượt. Một lần đối chiếu nhiều PDF tính một lượt AI.',
 'Admin must configure AI and installAIWorker for automatic LLM calls. Manual prompts can save results to Drive.':'Admin cần cấu hình AI và installAIWorker để tự gọi LLM. Có thể dùng prompt thủ công với kết quả lưu vào Drive.',
 'Results from Drive':'Kết quả từ Drive','Queued job not started':'Hủy lượt chưa chạy',
 'Additional documents needed':'Cần bổ sung','Conflicting information':'Có mâu thuẫn',
 'Verification needed':'Cần xác minh','Ready for reviewer':'Sẵn sàng reviewer xem xét',
 'PDFs reviewed':'PDF đã kiểm tra','pages':'trang','page':'trang',
 'Check page':'cần xem lại trang','System checks':'Kiểm tra hệ thống',
 'No graph issues detected.':'Không có lỗi graph được phát hiện.',
 'Confirm follow-up tasks':'Xác nhận tạo follow-up tasks',
 'No results for this source yet.':'Chưa có kết quả cho nguồn này.',
 'Open prompt':'Mở prompt','Results folder':'Folder nhận kết quả',
 'The source changed':'nguồn đã thay đổi',
 'The entire PDF matches the selected task':'Toàn bộ PDF này phù hợp với task đã chọn',
 'I confirm assigned users may read this entire PDF':'Tôi xác nhận được phép cho người được giao task đọc toàn bộ PDF này',
 'Link working copy · UPLOADED':'Gắn bản làm việc · UPLOADED',
 'Confirm task creation and follow-up in the existing KODA Calendar':'Tôi xác nhận tạo task và follow-up vào Calendar KODA hiện có',
 'Create selected tasks':'Tạo tasks đã chọn',
 'OCR + AI · EUDR review':'OCR + AI · Kiểm tra EUDR',
 'Read the document package and see missing or conflicting items in the browser.':'Đọc bộ chứng từ và nhận danh sách thiếu/mâu thuẫn ngay trên web.',
 'Extract products, SKUs (PO# per block), quantities and materials. Review the preview before saving. NON_WOOD does not create a material; UNKNOWN requires confirmation.':'Trích xuất sản phẩm, SKU (PO# theo block), quantity và material. Kiểm tra bản preview trước khi lưu. NON_WOOD sẽ không tạo material; UNKNOWN cần xác nhận.',
 'Existing folder':'Folder hiện có','Original PDF · up to 100 MB':'PDF gốc · tối đa 100 MB',
 'Or select a registered PDF':'Hoặc chọn PDF đã đăng ký','Select source':'Chọn source',
 'Choose the original file again for local OCR. Its SHA-256 must match the registered source.':'Chọn lại file gốc để OCR trên máy. File phải trùng SHA-256 với source đã đăng ký.',
 'Run OCR on all pages (if the text layer is missing or wrong)':'OCR lại toàn bộ trang (khi text layer sai hoặc thiếu)',
 'Extract with KODA layout':'Trích theo layout KODA',
 'Run OCR + AI review':'Chạy OCR + AI kiểm tra','Extract SO/PO with AI':'Trích SO/PO bằng AI',
 'Stop OCR':'Dừng OCR','AI connection is ready. Usage is tracked by Order.':'Kết nối AI đã sẵn sàng. Lượt gọi được ghi nhận theo Order.',
 'AI is unavailable; Admin must configure the connection and worker. KODA OCR/layout and Excel remain available.':'AI chưa sẵn sàng; Admin cần cấu hình kết nối và worker. OCR/layout KODA và Excel vẫn dùng được.',
 'Download Excel template':'Tải template Excel','Template .xlsx · up to 10 MB':'File template .xlsx · tối đa 10 MB',
 'Read Excel':'Đọc Excel','Each row is one product material. Repeated quantities across materials count once per product.':'Mỗi dòng là một material của product. Quantity lặp lại giữa các material sẽ chỉ tính một lần cho product.',
 'Recent runs':'Lần chạy gần đây','View result':'Xem kết quả','Cancel':'Hủy','No previous runs.':'Chưa có lần chạy.',
 'Saved previews':'Bản preview đã lưu','Open preview':'Mở preview',
 'Choose the existing Order folder':'Chọn folder đúng Order',
 'Review and correct the extracted data':'Kiểm tra và sửa dữ liệu trích xuất',
 'Leave Scientific Name blank if the source does not provide it. No data has been APPROVED.':'Scientific Name để trống nếu chưa có trên chứng từ. Chưa có dữ liệu nào được APPROVED.',
 'I checked products, SKUs, quantities and materials against the original file.':'Tôi đã đối chiếu sản phẩm, SKU, quantity và material với file gốc.',
 "Confirm and split PDFs":"Xác nhận & tách PDF",
 "Confirm classification":"Xác nhận phân loại",
 "Review the page ranges, then confirm and split real PDF copies into their evidence blocks.":"Kiểm tra khoảng trang, sau đó xác nhận để tạo PDF riêng và lưu vào đúng block chứng từ.",
 "Saving classification records the groups only. Confirm and split PDFs creates actual files. Originals are retained; new copies remain pending review.":"Lưu phân loại chỉ ghi nhận nhóm. Bấm “Xác nhận & tách PDF” để tạo file thật. Bản gốc được giữ nguyên; bản con vẫn chờ duyệt.",
 "Classification saved. No PDF has been created by this action.":"Đã lưu phân loại. Thao tác này chưa tạo PDF.",
 "Sections must cover each original page once in order.":"Các khoảng trang phải liên tiếp, phủ đủ PDF gốc, không trùng hoặc bỏ sót trang.",
 "Confirm the original pages and evidence blocks before splitting.":"Hãy kiểm tra PDF gốc và đánh dấu xác nhận khoảng trang, block trước khi tách.",
 "Choose a document type and evidence block for every section before splitting.":"Chọn loại chứng từ và block cho từng phân đoạn trước khi tách.",
 "The original PDF changed. Review its current version before splitting.":"PDF gốc đã thay đổi. Hãy kiểm tra phiên bản hiện tại trước khi tách.",
 "PDF copies saved in their evidence blocks. Originals are retained; evidence approval is still required.":"Đã lưu các PDF con vào đúng block. Bản gốc được giữ nguyên; chứng từ vẫn cần được duyệt.",
 'One PDF section must belong to one material; separate the page ranges first.':'Một phân đoạn PDF chỉ được gắn với một vật liệu. Hãy chia lại khoảng trang trước khi xác nhận.',
 'Confirm and save to Order':'Xác nhận và lưu vào Order',
 'The preview is valid for human confirmation.':'Dữ liệu hợp lệ để user xác nhận.',
 'Upload a PDF package from Sourcing/Purchasing to review its content, missing documents and next actions.':'Tải một bộ PDF từ Sourcing/Purchasing để kiểm tra nội dung, chứng từ còn thiếu và việc cần làm tiếp.',
 '1. Upload documents':'1. Upload bộ chứng từ','PDF · up to 100 MB':'PDF · tối đa 100 MB',
 'The original is saved under this Order. After an interruption, select the same file and click Resume.':'File gốc được lưu theo Order. Sau khi gián đoạn, chọn lại đúng file và nhấn Resume.',
 '2. AI review':'2. Kiểm tra bằng AI','Create review prompt':'Tạo prompt kiểm tra',
 'Upload a PDF to begin.':'Upload PDF để bắt đầu.',
 'Copy the prompt into ChatGPT Business, grant file access or attach the PDF. AI stores results in Drive when connected; then click Refresh results.':'Copy prompt sang ChatGPT Business, cấp quyền đọc file hoặc đính kèm PDF. AI lưu kết quả vào Drive khi kết nối cho phép; sau đó nhấn Refresh results.',
 'Refresh results from Drive':'Refresh results từ Drive','3. Results and actions':'3. Kết quả và hành động',
 'An authorized person must check the current EUDR rules before concluding.':'Cần người phụ trách kiểm tra lại phiên bản quy định EUDR trước khi kết luận.',
 'The Order or documents changed. Create a new prompt before using this result.':'Order hoặc chứng từ đã thay đổi. Tạo prompt mới trước khi dùng kết quả này.',
 'Check':'Kiểm tra','Status / Page':'Trạng thái / Trang','Issue':'Vấn đề','Next action':'Cần làm gì',
 'AI found no issues; continue reviewing requirements and approving evidence.':'AI chưa ghi nhận vấn đề; tiếp tục kiểm tra các yêu cầu và duyệt chứng từ.',
 'Suggested document boundaries':'Ranh giới chứng từ đề xuất',
 'Original pages':'Trang gốc','Confidence':'Độ tin cậy',
 'Confirm boundaries and split PDF':'Xác nhận ranh giới và tách PDF',
 'Import result JSON':'Import file JSON kết quả',
 'No previous review. Create a prompt in step 2.':'Chưa có lần kiểm tra. Tạo prompt ở bước 2.',
 'Workspace requirements awaiting approval':'Yêu cầu trong Workspace chưa được duyệt',
 'Unassigned':'Chưa phân công','No required tasks await approval.':'Không có task bắt buộc đang chờ duyệt.',
 'This check supports Marketing in reviewing evidence. EUDR and DDS decisions require an authorized operator.':'Kiểm tra này hỗ trợ Marketing đối chiếu hồ sơ. Kết luận EUDR và DDS cần người có thẩm quyền.',
 'Split PDFs':'Các PDF đã tách','Link to evidence task':'Gắn vào task chứng từ',
 'This working copy comes from the original package. Link it to the right evidence task and approve it before Export.':'Đây là bản làm việc từ bộ gốc. Gắn vào đúng task chứng từ và duyệt trước khi dùng cho Export.',
 'No paid API is needed for this prompt workflow. The review runs when you send the prompt in ChatGPT.':'Không cần mua API để dùng luồng prompt này. Kiểm tra chỉ chạy khi bạn gửi prompt trong ChatGPT.',
 'Link PDF to evidence task':'Gắn PDF vào task chứng từ',
 'I confirm this PDF matches the selected task, material and supplier.':'Tôi xác nhận nội dung PDF đúng task, vật liệu và supplier được chọn.',
 'Link and submit for review':'Gắn và gửi quy trình duyệt',
 'Confirm working copy split':'Xác nhận tách bản làm việc',
 'Check the suggested pages and boundaries above before confirming. The original remains intact.':'Kiểm tra các trang và ranh giới đề xuất ở trên trước khi xác nhận. Bản gốc được giữ nguyên.',
 'Select the original PDF again':'Chọn lại đúng PDF gốc',
 'I checked and confirmed each document boundary.':'Tôi đã kiểm tra và xác nhận ranh giới từng chứng từ.',
 'Split and save to Order':'Tách và lưu vào Order'
};
Object.assign(v27Labels,{
 'PO pending':'PO chưa rõ','Lot pending':'lot pending','Source pending':'Chưa có nguồn',
 'OCR stopped.':'Đã dừng OCR.',
 'The Order changed. Check it again and validate before saving.':'Order đã thay đổi. Đối chiếu lại và Validate trước khi lưu.',
 'The queued job was cancelled.':'Đã hủy lượt chưa chạy.',
 'Enter an Order number first.':'Nhập Order No. trước.',
 'Choose the existing folder to continue.':'Chọn folder hiện có để tiếp tục.',
 'A draft Order was created; products are saved only after preview confirmation.':'Đã tạo bản nháp Order; sản phẩm chỉ được lưu sau khi xác nhận preview.',
 'The file does not match the selected source.':'File không trùng source đã chọn.',
 'Saving original PDF':'Lưu PDF gốc',
 'Admin must configure GEMINI API and install the worker before AI review.':'Admin cần cấu hình GEMINI API và cài worker trước khi chạy AI.',
 'Select the original PDF of the uploaded dossier.':'Chọn đúng PDF gốc của bộ chứng từ đã upload.',
 'AI job queued. You can close this window and return to the Order.':'Đã xếp lượt AI. Có thể đóng cửa sổ và xem lại tại Order.',
 'AI has returned a result. Open Dossier Check to review gaps and actions.':'AI đã trả kết quả. Mở Dossier Check để xem phần thiếu và hành động.',
 'Open Dossier Check results':'Mở kết quả Dossier Check',
 'Awaiting result; you can close this window and return later.':'chờ kết quả; có thể đóng và xem lại sau.',
 'Still processing. Reopen Smart Import to see the result.':'Lượt vẫn đang xử lý. Mở lại Smart Import để xem kết quả sau.',
 'Validate and confirm the source before saving.':'Validate và xác nhận đối chiếu trước khi lưu.',
 'Select 1–20 PDFs.':'Chọn 1–20 PDF.','Select 1–20 PDFs linked to this source.':'Chọn 1–20 PDF đã gắn nguồn.',
 'AI is not configured.':'AI chưa cấu hình.',
 'Stopped. Uploaded files and queued jobs are preserved.':'Đã dừng. File đã upload và lượt đã xếp hàng vẫn được giữ.',
 'PDFs saved to Drive; select files and run the review.':'PDF đã lưu vào Drive; chọn file và chạy đánh giá.',
 'The combined text exceeds the AI limit. Raise the Admin limit or review a smaller group; no files were silently skipped.':'Tổng text vượt giới hạn AI. Tăng giới hạn Admin hoặc chọn nhóm file nhỏ hơn; không file nào được âm thầm bỏ qua.',
 'Refresh results from Drive after the worker finishes.':'Dùng Refresh results from Drive sau khi worker xử lý.',
 'Drive results loaded. QUEUED/RUNNING jobs await the worker.':'Đã đọc kết quả từ Drive. Lượt QUEUED/RUNNING cần chờ worker.',
 'If this PDF includes multiple documents or Orders, split the right section before sharing it with a task.':'Nếu file chứa nhiều chứng từ/đơn hàng, cần tách đúng phần trước khi chia sẻ cho task.',
 'Link a task to the source in Product · Material · PO / lot first.':'Chưa có task gắn nguồn. Gắn task trong Product · Material · PO / lot trước.',
 'PDF linked. Submit it for review in the existing workflow.':'Đã gắn PDF. Submit và reviewer duyệt chứng từ theo workflow hiện có.',
 'Follow-up tasks created. This did not approve any evidence.':'Đã tạo follow-up. Các task không tự phê duyệt chứng từ.',
 'Check this source before using the result.':'CẦN KIỂM TRA LẠI',
 'MORE DOCUMENTS / VERIFICATION NEEDED':'CẦN BỔ SUNG / XÁC MINH',
 'AWAITING HUMAN REVIEW':'CHỜ NGƯỜI PHỤ TRÁCH DUYỆT',
 'AWAITING RESULT':'ĐANG CHỜ KẾT QUẢ',
 'Prompt copied.':'Đã copy prompt.',
 'The result JSON may be up to 48 KB.':'JSON kết quả tối đa 48 KB.',
 'Confirm the content and task.':'Cần xác nhận nội dung và task.',
 'No matching task. Create one in the Order first.':'Không có task phù hợp. Tạo task trong Order trước.',
 'Linked to a task as UPLOADED. Submit and review it in Order Workspace.':'Đã gắn task ở trạng thái UPLOADED. Submit và duyệt trong Order Workspace.',
 'Confirm document boundaries before splitting.':'Cần xác nhận ranh giới trước khi tách.',
 'This file does not match the reviewed original PDF.':'File không trùng PDF gốc đã kiểm tra.',
 'Working copies saved. Link each to the right task and review before Export.':'Đã tách bản làm việc. Gắn đúng task và duyệt chứng từ trước khi Export.'
});
Object.assign(v27Labels,{
 'Saved {products} products and {materials} materials. Continue collecting and reviewing evidence.':'Đã lưu {products} product và {materials} material. Tiếp tục thu thập và duyệt chứng từ.',
 'Reading from Drive:':'Đọc từ Drive:','Job queued:':'Đã xếp lượt',
 'Uploading':'Đang tải lên','Linked':'đã gắn','Prompt for ChatGPT Business':'Prompt cho ChatGPT Business',
 'Save JSON named':'Lưu JSON đúng tên',
 'in this folder, then Refresh results from Drive.':'trong folder này, rồi Refresh results from Drive.',
 'Synchronized {count} results.':'Đã đồng bộ {count} kết quả.',
 'pages reviewed':'trang đã đọc',
 'Review the original document and source.':'Kiểm tra chứng từ gốc và nguồn.'
});
Object.assign(v27Labels,{
 'upload incomplete':'upload chưa hoàn tất','Read:':'Đã đọc:',
 'issues to resolve. AI results require human review.':'điểm cần xử lý. Kết quả AI cần người phụ trách duyệt.',
 'Evidence':'Chứng từ','Link source PDF to evidence task':'Gắn PDF vào evidence task'
});
Object.assign(v27Labels,{
 'Supplier material PO':'PO mua vật liệu của nhà cung cấp',
 'PO line':'Dòng PO','Lot / batch':'Lô / đợt','Forest origin':'Nguồn gốc rừng',
 'Plot ID (cho PLOT)':'Mã lô đất (cho PLOT)',
 '+ Supplier/forest node':'+ Nút nhà cung cấp / rừng',
 'Upstream':'Thượng nguồn','Downstream':'Hạ nguồn','INV / shipment / transaction':'Hóa đơn / lô hàng / giao dịch',
 'Record':'Bản ghi','Unlink':'Bỏ liên kết','Deactivate':'Ngừng dùng',
 'EUDR Dossier · Material / PO / lot':'Hồ sơ EUDR · Vật liệu / PO / lô',
 'Supplier material PO / line / lot':'PO vật liệu của nhà cung cấp / dòng / lô',
 'Refresh results from Drive':'Làm mới kết quả từ Drive','Result folder':'Thư mục kết quả',
 'Source Reference':'Tham chiếu nguồn',
 'Validate preview':'Kiểm tra bản xem trước','Smart Import · SO/PO/Excel':'Nhập thông minh · SO/PO/Excel',
 'Quantity used':'Số lượng sử dụng',
 'Customer (optional)':'Khách hàng (không bắt buộc)',
 'Due date (optional)':'Hạn nộp (không bắt buộc)'
});
Object.assign(v27Labels,{
 'Material / PO / lot dossier · up to 100 MB/PDF':'Hồ sơ theo vật liệu / PO / lô · tối đa 100 MB/PDF',
 'Legacy · whole SO':'Bản cũ · toàn bộ SO',
 'Open material dossier · upload, OCR/AI and results':'Mở hồ sơ vật liệu · upload, OCR/AI và kết quả',
 'Previous whole-SO reviews':'Lịch sử kiểm tra toàn SO',
 'Earlier whole-order results are kept here. This is a separate historical workflow.':'Kết quả kiểm tra toàn SO trước đây được giữ tại đây. Đây là luồng lịch sử riêng.',
 'Open previous SO review':'Mở kiểm tra SO trước đây',
 'Upload documents for this material':'Upload chứng từ cho vật liệu',
 'PDFs are linked to the selected PO/lot.':'PDF sẽ được gắn với PO/lô đã chọn.',
 'PO/lot unknown: PDFs are stored under this material. Verify and link the correct source before AI review.':'Chưa xác định PO/lô: PDF được lưu vào material này, chờ bạn kiểm tra và gắn đúng nguồn trước khi AI đánh giá.',
 'Upload PDFs to this material':'Upload PDF vào material',
 'Stop / pause upload':'Dừng / tạm ngưng upload',
 'PDFs awaiting source assignment':'PDF chưa xác định nguồn',
 'Confirm link to selected PO/lot':'Xác nhận gắn vào PO/lô đang chọn',
 'No PDFs awaiting source assignment.':'Không có PDF chờ gắn nguồn.',
 'Confirm the PO/lot source before AI review. You can upload PDFs up to 100 MB each now.':'Cần xác nhận nguồn PO/lô trước khi chạy AI đánh giá. Có thể upload PDF 100 MB/file ngay bây giờ.'
});
Object.assign(v27Labels,{
 'All materials':'Tất cả vật liệu','Unassigned materials':'Vật liệu chưa gắn product','No materials recorded.':'Chưa có vật liệu.',
 'Source PO/lot (optional · add later)':'PO/lô nguồn (tùy chọn · có thể bổ sung sau)',
 'You can upload and review PDFs for this material without a PO/lot. Add source details later.':'Chưa biết PO/lô vẫn có thể upload và đánh giá PDF theo material. Bổ sung thông tin nguồn sau.',
 'Review selected PDFs':'Đánh giá các PDF đã chọn',
 'Select uploaded PDFs for material review; PO/line/lot can be added later.':'Chọn PDF đã upload để đánh giá material; PO/line/lot có thể bổ sung sau.',
 'Preparing material review; PO/line/lot can be added later.':'Đang chuẩn bị đánh giá material; PO/line/lot có thể bổ sung sau.',
 'PDFs were saved to Drive under this material. Select PDFs to review; PO/line/lot can be added later.':'PDF đã lưu vào Drive theo material. Chọn PDF để đánh giá; PO/line/lot có thể bổ sung sau.',
 'Add PO / line / lot when available':'Bổ sung PO / line / lot khi có thông tin',
 'PO/line/lot saved after user confirmation.':'Đã lưu PO/line/lot theo xác nhận của người dùng.',
 'Select at least one PDF for this material.':'Chọn ít nhất một PDF của material này.',
 'PDFs are ready. PO/line/lot can be added later.':'PDF đã sẵn sàng. PO/line/lot còn thiếu có thể bổ sung sau.'
});
Object.assign(v27Labels,{
 'The Drive result was saved for reference. Order evidence changed after the prompt; findings were not queued and PDF splitting is disabled. Create a fresh check for current actions.':'Đã lưu kết quả từ Drive để tham khảo. Chứng từ của Order thay đổi sau khi tạo prompt; hệ thống không đưa nhận xét vào hàng chờ và không cho tách PDF. Tạo lượt kiểm tra mới trước khi thực hiện hành động.'
});
Object.assign(v27Labels,{
 'Create a material review prompt from selected PDFs':'Tạo prompt đánh giá material từ PDF đã chọn',
 'Run OCR + AI for selected PDFs':'Chạy OCR + AI cho PDF đã chọn',
 'Create a material review prompt':'Tạo prompt đánh giá material',
 'Upload documents for this material':'Upload chứng từ cho material',
 'The web and backend versions differ. Deploy the Netlify function and Apps Script bridge from this update, then reopen this dossier. Your uploaded PDFs remain in Drive.':'Phiên bản web và backend chưa đồng bộ. Cập nhật Netlify Function và Apps Script bridge trong gói này, sau đó mở lại dossier. PDF đã upload vẫn ở Drive.'
});
Object.assign(v27Labels,{
 'Select a material, add its PDFs, then review the findings here.':'Chọn vật liệu, thêm PDF và xem nhận xét ngay tại đây.',
 '1. Material and source':'1. Vật liệu và nguồn',
 '2. PDF documents':'2. Chứng từ PDF',
 'Upload PDFs':'Tải PDF lên',
 'Select the uploaded PDFs to create a review prompt. PO/line/lot can be added later.':'Chọn PDF đã tải lên để tạo prompt đánh giá. Có thể bổ sung PO/dòng/lô sau.',
 '3. Review selected PDFs':'3. Đánh giá PDF đã chọn',
 'Prompt ready':'Prompt đã sẵn sàng',
 'Review prompt':'Prompt đánh giá',
 'Open ChatGPT copies the prompt. Paste it into the chat. Refresh here after ChatGPT saves the result to authorized Drive.':'Nút Mở ChatGPT sẽ sao chép prompt. Dán vào cuộc trò chuyện. Khi ChatGPT đã lưu kết quả vào Drive được cấp quyền, làm mới kết quả tại đây.',
 '4. Results':'4. Kết quả',
 'Prompt is unavailable. Create a new review prompt.':'Chưa có nội dung prompt. Hãy tạo một prompt đánh giá mới.',
 'Select the prompt and copy it manually.':'Hãy chọn nội dung prompt và sao chép thủ công.',
 'Prompt ready. Copy it or open ChatGPT.':'Prompt đã sẵn sàng. Sao chép hoặc mở ChatGPT.'
});
Object.assign(v27Labels,{
 'View saved prompt':'Xem lại prompt đã lưu',
 'Saved prompt loaded.':'Đã mở lại prompt đã lưu.',
 'Waiting for a result in Drive. Click Refresh results from Drive after ChatGPT saves it.':'Đang chờ kết quả trên Drive. Sau khi ChatGPT lưu xong, nhấn Làm mới kết quả từ Drive.'
});
Object.assign(v27Labels,{
 'Split and classify pages':'Tách trang và phân nhóm chứng từ',
 'Review the original PDF pages before confirming a block.':'Kiểm tra các trang PDF gốc trước khi xác nhận nhóm chứng từ.',
 'From page':'Từ trang','To page':'Đến trang','Document type':'Loại chứng từ',
 'Evidence block':'Nhóm chứng từ',
 '01 · Commercial / Shipping':'01 · Thương mại / Giao hàng',
 '02 · FSC / Certification':'02 · FSC / Chứng nhận',
 '03 · Transport':'03 · Vận chuyển',
 '04 · Geolocation':'04 · Tọa độ rừng',
 'I checked the original PDF pages and confirm this range and evidence block.':'Tôi đã kiểm tra trang PDF gốc và xác nhận khoảng trang cùng nhóm chứng từ này.',
 'Save split PDF':'Lưu PDF đã tách','Cancel':'Hủy',
 'The original PDF is retained. Link the split copy to the matching evidence task after saving.':'PDF gốc được giữ nguyên. Sau khi lưu, gắn bản tách vào task chứng từ phù hợp.',
 'Check the page range and confirm the evidence block.':'Kiểm tra khoảng trang và xác nhận nhóm chứng từ.',
 'The original PDF changed. Refresh the review before splitting.':'PDF gốc đã thay đổi. Hãy làm mới lượt đánh giá trước khi tách.',
 'Saving split PDF...':'Đang lưu PDF đã tách...',
 'Split PDF saved. Link it to the matching evidence task.':'Đã lưu PDF đã tách. Hãy gắn vào task chứng từ phù hợp.',
 'Link to evidence task':'Gắn vào task chứng từ',
 'Select evidence block':'Chọn nhóm chứng từ',
 'Review proposed section':'Kiểm tra và tách phần được đề xuất',
 'Unclassified':'Chưa phân nhóm'
});
Object.assign(translations.vi,v27Labels);
Object.entries(v27Labels).forEach(([en,vi])=>{translations.en[vi]=en;});
const v27Vietnamese=new Set(Object.values(v27Labels));
const v27Fragments=[
 ['upload incomplete','upload chưa hoàn tất'],['Read:','Đã đọc:'],
 ['issues to resolve. AI results require human review.','điểm cần xử lý. Kết quả AI cần người phụ trách duyệt.'],
 ['Unverified points','Các điểm chưa xác minh'],['Additional documents needed','Cần bổ sung'],
 ['PDFs are not linked to a PO/lot. Link the source in Product · Material · PO / lot before reviewing.','PDF chưa gắn PO/lô. Gắn nguồn trong Product · Material · PO / lot để đưa vào đánh giá.'],
 ['Save JSON named','Lưu JSON đúng tên'],['in this folder, then Refresh results from Drive.','trong folder này, rồi Refresh results from Drive.'],
 ['If this PDF includes multiple documents or Orders, split the right section before sharing it with a task.','Nếu file chứa nhiều chứng từ/đơn hàng, cần tách đúng phần trước khi chia sẻ cho task.'],
 ['The source changed','nguồn đã thay đổi'],['Check page','cần xem lại trang'],
 ['Linked to task','đã gắn task'],['Not linked to task','chưa gắn task'],
 ['Saving original PDF','Lưu PDF gốc'],['Awaiting result; you can close this window and return later.','chờ kết quả; có thể đóng và xem lại sau.'],
 ['Saved','Đã lưu'],['products and','product và'],['materials. Continue collecting and reviewing evidence.','material. Tiếp tục thu thập và duyệt chứng từ.'],
 ['Job queued:','Đã xếp lượt'],['Refresh results from Drive after the worker finishes.','Dùng Refresh results from Drive sau khi worker xử lý.'],
 ['Missing','Thiếu'],['Uploaded','Đã tải lên'],['Queued','Đang chờ'],['Running','Đang xử lý'],['Completed','Đã xong'],['Unassigned','Chưa phân công'],
 ['Partial','Một phần'],['Complete','Đầy đủ'],['pages','trang'],['page','trang']
].sort((a,b)=>b[0].length-a[0].length);
function translateFragments(original){
 let value=original;
 for(const [en,vi] of v27Fragments)value=value.split(language==='en'?vi:en).join(language==='en'?en:vi);
 return value;
}
Object.assign(translations.en,{QUEUED:'Queued',RUNNING:'Running',DONE:'Completed',CANCELLED:'Cancelled',FAILED:'Failed',PARTIAL:'Partial',FULL:'Complete',SUPPORTED:'Supported',NOT_VERIFIABLE:'Not verifiable',CHAIN:'Supply chain',DOCUMENTS:'Documents',GEO_COUNTRY:'GEO and country of origin',LEGALITY:'Legal harvesting',MATERIAL_SPECIES:'Material and species',LOT_QUANTITY:'Lot and quantity',HARVEST_PERIOD_AREA:'Harvest period and area',DEFORESTATION:'Deforestation'});
Object.assign(translations.vi,{QUEUED:'Đang chờ',RUNNING:'Đang xử lý',DONE:'Đã xong',CANCELLED:'Đã hủy',FAILED:'Thất bại',PARTIAL:'Một phần',FULL:'Đầy đủ',SUPPORTED:'Có chứng cứ hỗ trợ',NOT_VERIFIABLE:'Không thể kiểm chứng',CHAIN:'Chuỗi cung ứng',DOCUMENTS:'Chứng từ',GEO_COUNTRY:'GEO và quốc gia xuất xứ',LEGALITY:'Khai thác hợp pháp',MATERIAL_SPECIES:'Vật liệu và loài gỗ',LOT_QUANTITY:'Lô và số lượng',HARVEST_PERIOD_AREA:'Thời gian và diện tích khai thác',DEFORESTATION:'Không phá rừng'});
Object.assign(translations.vi,{
 'AI Review':'Đánh giá AI','Documents':'Chứng từ','Issues':'Vấn đề','Customer Submission':'Hồ sơ khách hàng',
 'Search workspace records without an AI API. Prepare a manual review for document interpretation.':'Tra cứu dữ liệu nội bộ không cần AI API. Tạo gói đánh giá thủ công khi cần phân tích chứng từ.',
 'Missing documents':'Chứng từ còn thiếu','Pending approval':'Chờ duyệt','Unresolved issues':'Vấn đề chưa xử lý','Prepare ChatGPT Business Review':'Tạo gói đánh giá ChatGPT Business',
 'Review Pack prepared':'Đã tạo gói đánh giá','Download Review Pack':'Tải gói đánh giá','Copy review instruction':'Sao chép hướng dẫn đánh giá','Review instruction copied.':'Đã sao chép hướng dẫn.',
 'Review in your approved ChatGPT Business workspace, then import the JSON in AI Review.':'Đánh giá trong ChatGPT Business đã được phê duyệt, sau đó nhập JSON tại Đánh giá AI.',
 'Saved answer is stale. Run a fresh query.':'Dữ liệu đã thay đổi. Hãy tra cứu lại.','Evidence coverage':'Mức đầy đủ chứng từ','Current reviews':'Đánh giá còn hiệu lực','Human compliance determination':'Kết luận tuân thủ của người có thẩm quyền',
 'Refresh affected scope':'Kiểm tra lại phạm vi liên quan','Review Pack':'Gói đánh giá','ChatGPT result JSON':'File JSON kết quả ChatGPT','Validate and import':'Kiểm tra và nhập kết quả','Dimension':'Nhóm kiểm tra','Assessment':'Nhận xét',
 'Confirm finding and create Issue':'Xác nhận finding và tạo vấn đề','Prepare follow-up review':'Tạo đánh giá tiếp theo','No imported review yet.':'Chưa có kết quả được nhập.',
 'Issues & Resolution':'Vấn đề và xử lý','Review reason':'Lý do đánh giá','Next status':'Trạng thái tiếp theo','Resolution evidence':'Chứng từ xử lý','I confirm this transition and evidence.':'Tôi xác nhận thay đổi trạng thái và chứng từ.','Update Issue':'Cập nhật vấn đề','No issues in this scope.':'Không có vấn đề trong phạm vi này.',
 'Document Classification':'Phân loại chứng từ','PDF document':'File PDF','Inspect indexed PDF':'Phân tích PDF đã lập chỉ mục','Index PDFs in Ask KODA AI before classification. The original file remains unchanged.':'Lập chỉ mục PDF tại Ask KODA AI trước khi phân loại. File gốc được giữ nguyên.',
 'First page':'Trang đầu','Last page':'Trang cuối','Document type':'Loại chứng từ','Confirmed PO / lot':'PO / lô đã xác nhận','Evidence requirements':'Yêu cầu chứng từ','Evidence block':'Nhóm chứng từ','Reviewer note':'Ghi chú người kiểm tra','View section':'Xem phần chứng từ','Remove section':'Xóa phần phân loại','Add section':'Thêm phần phân loại','New section':'Phần phân loại mới',
 'I checked the pages and source links.':'Tôi đã kiểm tra trang và liên kết nguồn.','Confirm and link':'Xác nhận và liên kết','Open split workflow':'Mở quy trình tách PDF','OCR warnings':'Cảnh báo OCR','Classification never approves evidence. Mixed PDFs need a reviewed split before supplier delivery.':'Phân loại không duyệt chứng từ. PDF tổng hợp cần được kiểm tra và tách trước khi chia sẻ cho nhà cung cấp.',
 'Add component':'Thêm thành phần','Map Customer PO':'Liên kết PO khách hàng','Check NeoCondo readiness':'Kiểm tra hồ sơ NeoCondo','Create submission draft':'Tạo hồ sơ nháp','Components / BOM':'Thành phần / BOM','Customer PO mapping':'Liên kết PO khách hàng','Submission tracking':'Theo dõi nộp hồ sơ','Open submission package':'Mở gói hồ sơ','Actual upload time':'Thời điểm upload thực tế','Portal confirmation':'Xác nhận từ portal','Customer response':'Phản hồi khách hàng','Rejection reason':'Lý do từ chối','I confirm the recorded action.':'Tôi xác nhận hành động được ghi nhận.','Update tracking':'Cập nhật theo dõi','Export approved submission pack':'Xuất gói hồ sơ đã duyệt',
 'Component details':'Thông tin thành phần','Component name':'Tên thành phần','Component type':'Loại thành phần','Units per Product':'Số lượng trên sản phẩm','Weight per unit':'Trọng lượng mỗi đơn vị','Weight unit':'Đơn vị trọng lượng','Input waste (%)':'Tỷ lệ hao hụt (%)','Manufacturing operation':'Công đoạn sản xuất','Factory':'Nhà máy','Measurement state':'Trạng thái xác minh số liệu','Composition':'Thành phần vật liệu','Add composition':'Thêm thành phần vật liệu','Source allocation per Product':'Phân bổ nguồn cho mỗi sản phẩm','Add allocation':'Thêm phân bổ','Actual source':'Nguồn thực tế','Quantity per Product':'Số lượng trên sản phẩm','Measurement evidence':'Chứng từ xác minh số liệu','Save component':'Lưu thành phần',
 'Customer PO details':'Thông tin PO khách hàng','KODA Product':'Sản phẩm KODA','Customer Product':'Sản phẩm khách hàng','Customer quantity':'Số lượng khách hàng','Manufacturing entity':'Đơn vị sản xuất','Role for this Order':'Vai trò trong đơn hàng','Actual operations':'Công đoạn thực tế','Add operation':'Thêm công đoạn','Operation':'Công đoạn','Operation quantity':'Số lượng thực hiện','Operation date':'Ngày thực hiện','Operation evidence':'Chứng từ công đoạn','Customer-required documents':'Chứng từ khách hàng yêu cầu',
 'I reviewed confidentiality and authorize Customer sharing of this version.':'Tôi đã kiểm tra thông tin bí mật và cho phép gửi phiên bản này cho khách hàng.','Contains price; verified redaction is required.':'Có thông tin giá; phải xác minh file đã che giá.','All actual BOM components are included.':'Đã bao gồm toàn bộ thành phần BOM thực tế.','All harvest plots are included.':'Đã bao gồm toàn bộ vùng khai thác.','Customer clarification reference for 4/5 ha discrepancy':'Chứng cứ khách hàng làm rõ chênh lệch ngưỡng 4/5 ha','I verified this Customer mapping.':'Tôi đã xác minh liên kết dữ liệu khách hàng.','I confirm the Customer PO and Product.':'Tôi xác nhận PO và sản phẩm khách hàng.','Save Customer mapping':'Lưu liên kết khách hàng',
 'Review imported. Evidence remains pending human approval.':'Đã nhập kết quả. Chứng từ vẫn cần người có thẩm quyền duyệt.','Original PDF unchanged; evidence still requires review.':'File PDF gốc không thay đổi; chứng từ vẫn cần đánh giá.','Package exported. Upload to NeoCondo remains manual.':'Đã xuất gói hồ sơ. Việc upload NeoCondo được thực hiện thủ công.'
});

// v2.9.1 automatic review return labels.
Object.assign(translations.vi,{
 'Review in your approved ChatGPT Business workspace. The completed result will return automatically to AI Review after it is saved through Drive.':'Gửi yêu cầu trong ChatGPT Business đã được phê duyệt. Kết quả sẽ tự quay về tab Đánh giá AI sau khi ChatGPT lưu thành công qua Drive.',
 'Start ChatGPT review':'Bắt đầu kiểm tra bằng ChatGPT',
 'Open ChatGPT':'Mở ChatGPT',
 'Check for results':'Kiểm tra kết quả',
 'Waiting for ChatGPT result':'Đang chờ kết quả từ ChatGPT',
 'Copy request for ChatGPT':'Sao chép yêu cầu gửi ChatGPT',
 'No review result yet.':'Chưa có kết quả kiểm tra.',
 'Administrator recovery tools':'Công cụ hỗ trợ dành cho Admin',
 'Use only when the Drive return connection is unavailable. Select a completed result, never the input Review Pack.':'Chỉ dùng khi kết nối nhận kết quả qua Drive chưa hoạt động. Chọn kết quả đã kiểm tra, không chọn gói đầu vào Review Pack.',
 'Send the prepared request to ChatGPT Business. ChatGPT saves the completed result through the approved Drive connection; this page receives it automatically.':'Gửi yêu cầu đã chuẩn bị sang ChatGPT Business. ChatGPT lưu kết quả qua kết nối Drive đã được cấp quyền; trang này sẽ tự nhận kết quả.',
 'Results are checked automatically while this tab is visible and when you return. No file import is needed.':'Trang tự kiểm tra kết quả khi đang mở và khi bạn quay lại. Bạn không cần tải hay nhập file kết quả.',
 'Request copied. Open ChatGPT, paste and send it. The result will return here automatically after ChatGPT saves it.':'Đã sao chép yêu cầu. Mở ChatGPT, dán và gửi. Kết quả sẽ tự hiện tại đây sau khi ChatGPT lưu thành công.',
 'Copy this request into ChatGPT':'Sao chép yêu cầu này sang ChatGPT',
 'Automatic copying is unavailable. Press Ctrl+C to copy the selected request, then paste it into ChatGPT.':'Trình duyệt chưa cho phép sao chép tự động. Nhấn Ctrl+C để sao chép phần đã chọn, sau đó dán vào ChatGPT.',
 'ChatGPT results received. Review the findings below. Evidence still requires human approval.':'Đã nhận kết quả từ ChatGPT. Xem các phát hiện bên dưới. Chứng từ vẫn cần người có thẩm quyền duyệt.',
 'Still waiting for ChatGPT to save the completed result. You do not need to upload a file here.':'Đang chờ ChatGPT lưu kết quả kiểm tra. Bạn không cần upload file tại đây.',
 'This is the input pack. Send the review request to ChatGPT; the completed result will return here automatically.':'Đây là gói đầu vào, chưa phải kết quả. Hãy gửi yêu cầu kiểm tra sang ChatGPT; kết quả sẽ tự quay về đây.',
 'The documents changed. Start a new ChatGPT review.':'Chứng từ hoặc dữ liệu đã thay đổi. Hãy tạo lượt kiểm tra ChatGPT mới.',
 'Several results were returned for this review. Ask the administrator to select the intended file.':'Có nhiều file kết quả cho cùng lượt kiểm tra. Nhờ Admin xác định file cần dùng.',
 'The returned result could not be validated. Ask ChatGPT to follow the review request exactly, or contact the administrator.':'Kết quả trả về chưa đúng yêu cầu kiểm tra. Yêu cầu ChatGPT thực hiện đúng hướng dẫn đã gửi hoặc liên hệ Admin.',
 'Review in your approved ChatGPT Business workspace, then import the JSON in AI Review.':'Gửi yêu cầu trong ChatGPT Business đã được phê duyệt. Kết quả được tự nhận tại tab Đánh giá AI sau khi ChatGPT lưu qua Drive.',
 WRONG_REVIEW_FILE:'Đây là gói đầu vào Review Pack, chưa phải kết quả ChatGPT. Hãy sao chép yêu cầu sang ChatGPT để thực hiện kiểm tra.'
});

// v2.9.2 material dossier upload queue.
Object.assign(translations.vi,{
 'Files in this upload queue':'Các file trong hàng đợi upload',
 'Waiting to upload':'Chờ upload',
 'Saved to dossier':'Đã lưu vào hồ sơ',
 'Already in this dossier':'Đã có trong hồ sơ này',
 'Upload failed':'Upload chưa thành công',
 'Upload paused':'Đã tạm dừng upload',
 'Remove from queue':'Gỡ khỏi hàng đợi',
 'Choose several PDFs together, or choose again to add more files.':'Chọn nhiều PDF cùng lúc hoặc chọn thêm nhiều lần để bổ sung vào hàng đợi.',
 'Files added to the queue. Click Upload PDFs to start.':'Đã thêm file vào hàng đợi. Bấm Upload PDFs để bắt đầu.',
 'The queue accepts up to 20 waiting PDFs. Upload these first, then add the remaining files.':'Hàng đợi nhận tối đa 20 PDF chưa hoàn tất. Hãy upload các file này trước rồi thêm các file còn lại.',
 'Choose PDFs to add to the upload queue.':'Hãy chọn PDF để thêm vào hàng đợi upload.',
 'Upload completion could not be confirmed. Reselect the same PDF to resume.':'Chưa xác nhận được file đã upload hoàn tất. Chọn lại đúng PDF để tiếp tục.',
 'Upload paused. Completed PDFs are saved. Click Upload PDFs to continue the remaining files.':'Đã tạm dừng. Các PDF hoàn tất đã được lưu. Bấm Upload PDFs để tiếp tục các file còn lại.',
 'Some PDFs could not be uploaded. Saved PDFs are kept. Click Upload PDFs to retry the failed files.':'Một số PDF chưa upload thành công. Các file đã lưu được giữ nguyên. Bấm Upload PDFs để thử lại các file lỗi.',
 'PDFs saved to this material. You can add more files or select the PDFs to review.':'PDF đã được lưu theo material này. Bạn có thể thêm file hoặc chọn các PDF để đánh giá.'
});

// v2.9.4 geolocation labels.
Object.assign(translations.vi,{"Export GeoJSON": "Xuất GeoJSON", "Commodity production country (ISO code)": "Quốc gia khai thác / sản xuất nguyên liệu (mã ISO)", "Source precision (decimal digits, 6–12)": "Độ chính xác nguồn (6–12 chữ số thập phân)", "Exact Plot ID": "Mã lô chính xác", "Production date / range": "Ngày / khoảng thời gian khai thác", "Plot area (ha)": "Diện tích lô (ha)", "Plot relationship": "Quan hệ lô trong chuỗi cung ứng", "Validate & Register": "Kiểm tra & đăng ký lô", "Notes": "Ghi chú", "Source document": "Chứng từ nguồn", "Review GEO": "Kiểm tra tọa độ lô", "Shorten notes to leave room for the boundary confirmation.": "Rút ngắn ghi chú để lưu thêm xác nhận ranh giới lô."});

// v2.9.5 enterprise UX, regulatory registry, PDF zoom & calendar governance labels.
Object.assign(translations.vi,{
 "Regulatory Rule Registry (3-Tier Hierarchy)":"Danh mục Quy tắc Pháp lý & Chính sách (Phân cấp 3 tầng)",
 "Tier 1: EU Official Regulation (2023/1115 & 2025/2650) · Tier 2: Customer Requirements · Tier 3: KODA Internal SOPs.":"Tầng 1: Quy định chính thức của EU (2023/1115 & 2025/2650) · Tầng 2: Yêu cầu riêng của Khách hàng · Tầng 3: Quy trình nội bộ KODA.",
 "Rule Code":"Mã quy tắc",
 "Tier / Type":"Tầng / Phân loại",
 "Customer":"Khách hàng",
 "Summary":"Tóm tắt nội dung",
 "Effective Date":"Ngày hiệu lực",
 "Status":"Trạng thái",
 "Register / Update Regulation or Policy Rule":"Đăng ký / Cập nhật Quy tắc Pháp lý hoặc Chính sách",
 "LEGAL_REQUIREMENT (Tier 1 — EU Law)":"LEGAL_REQUIREMENT (Tầng 1 — Luật EU)",
 "CUSTOMER_REQUIREMENT (Tier 2 — Customer SOP)":"CUSTOMER_REQUIREMENT (Tầng 2 — Yêu cầu khách hàng)",
 "KODA_INTERNAL_POLICY (Tier 3 — Internal Policy)":"KODA_INTERNAL_POLICY (Tầng 3 — Chính sách nội bộ KODA)",
 "Rule summary & citation":"Tóm tắt quy tắc & trích dẫn điều khoản",
 "Save Rule":"Lưu quy tắc",
 "Rule saved to 43_REGULATION_RULES.":"Đã lưu quy tắc vào bảng 43_REGULATION_RULES.",
 "Country Risk Classification":"Phân loại rủi ro quốc gia",
 "ISO Country":"Mã quốc gia ISO",
 "Risk Tier":"Mức độ rủi ro",
 "Rule Version":"Phiên bản quy tắc",
 "Zoom out PDF":"Thu nhỏ PDF",
 "Zoom in PDF":"Phóng to PDF",
 "Reset PDF zoom":"Đặt lại tỷ lệ PDF",
 "SHA-256 verified":"Đã xác thực SHA-256",
 "Calendar sync mode":"Chế độ đồng bộ Lịch",
 "Reminders":"Nhắc lịch",
 "Synced events":"Sự kiện đã đồng bộ",
 "Manual sync required":"Cần đồng bộ thủ công"
});

