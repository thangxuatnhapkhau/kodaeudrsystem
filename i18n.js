// Display labels only. Backend enums, evidence, IDs and user-entered values stay canonical.
const translations={
 en:{
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
  'Assignment':'Phân công','Certificate metadata':'Thông tin chứng chỉ','Close internal evidence workflow':'Đóng quy trình hồ sơ nội bộ','Export Center':'Trung tâm xuất hồ sơ','GEO review':'Rà soát tọa độ','Materials · human confirmation':'Vật liệu · xác nhận của người phụ trách','Settings · Legal freshness':'Cài đặt · hiệu lực pháp lý','Supply Chain':'Chuỗi cung ứng','Temporary password':'Mật khẩu tạm thời','User access':'Quyền người dùng','Workspace context':'Ngữ cảnh workspace',
  'All assigned evidence':'Tất cả hồ sơ được phân công','Comments':'Bình luận','Processed copies':'Bản xử lý','Production country risk':'Rủi ro quốc gia sản xuất','Register plot':'Ghi nhận lô đất','Version history':'Lịch sử phiên bản','Advanced filters':'Bộ lọc nâng cao','Assigned Orders':'Đơn hàng được phân công','Select evidence':'Chọn hồ sơ',
  'Action':'Thao tác','Actions':'Thao tác','Active':'Đang hoạt động','Actor':'Người thực hiện','Category':'Loại','Change':'Thay đổi','Name / Email':'Tên / Email','Order / Evidence':'Đơn hàng / Hồ sơ','Order / Object':'Đơn hàng / Đối tượng','Owner / Due':'Phụ trách / Hạn','Role':'Vai trò','Scientific name':'Tên khoa học','Source':'Nguồn','Status':'Trạng thái','Time':'Thời gian',
  'Add relationship':'Thêm liên kết','Confirm Internal Closure':'Xác nhận đóng nội bộ','Confirm Materials & Create Folders':'Xác nhận vật liệu và tạo thư mục','Full Package':'Toàn bộ hồ sơ','Record Human Review':'Ghi nhận rà soát của người phụ trách','Record review':'Ghi nhận rà soát','Record verified fields':'Ghi nhận trường đã kiểm tra','Save assignment':'Lưu phân công','Save source-backed information':'Lưu thông tin có nguồn','Selected Package':'Hồ sơ đã chọn','Validate & Preview':'Kiểm tra và xem trước','Validate & Register':'Kiểm tra và ghi nhận',
  'Provision Login':'Cấp tài khoản','Temporary password':'Mật khẩu tạm thời','First login requires a password change.':'Lần đăng nhập đầu tiên cần đổi mật khẩu.','Passwords do not match.':'Mật khẩu xác nhận không khớp.','Password changed. Sign in with your new password.':'Đã đổi mật khẩu. Hãy đăng nhập bằng mật khẩu mới.','If this account exists, a password reset message will be sent.':'Nếu tài khoản tồn tại, hệ thống sẽ gửi hướng dẫn đặt lại mật khẩu.','has been created and the Sales Order has been registered.':'đã được tạo và Sales Order đã được ghi nhận.','Confirm materials and evidence requirements before uploading files.':'Xác nhận vật liệu và yêu cầu hồ sơ trước khi tải tệp lên.','Existing order folder found. Review and select the correct folder before creating this order.':'Đã tìm thấy thư mục liên quan. Hãy kiểm tra và chọn đúng thư mục trước khi tạo đơn.','Choose existing folder':'Chọn thư mục có sẵn',
  'Upload the processed derivative through the approved source document workflow after human verification.':'Tải bản xử lý qua quy trình của tài liệu gốc sau khi người phụ trách kiểm tra.','Generated prompt':'Prompt đã tạo','Open exact linked files in ChatGPT Work if connected; otherwise attach them. Links alone are not file access.':'Mở đúng tệp được liên kết nếu ChatGPT Work đã kết nối Drive; nếu chưa, hãy đính kèm tệp. Chỉ có liên kết không đồng nghĩa với quyền đọc tệp.',
  'Select a file of up to 3 MB':'Chọn tệp không quá 3 MB.','Cannot read file':'Không thể đọc tệp.','Saved.':'Đã lưu.','Saving…':'Đang lưu…','Copied.':'Đã sao chép.','Authentication required':'Cần đăng nhập.','NOT_STARTED':'Chưa bắt đầu','COLLECTING_EVIDENCE':'Đang thu thập hồ sơ','IN_REVIEW':'Đang rà soát','READY_FOR_OPERATOR_REVIEW':'Sẵn sàng cho người phụ trách rà soát','ACTION_REQUIRED':'Cần xử lý','CLOSED':'Đã đóng','MISSING':'Thiếu','UPLOADED':'Đã tải lên','SUBMITTED':'Đã nộp','APPROVED':'Đã duyệt nội bộ','REJECTED':'Bị từ chối','MORE_INFO_REQUIRED':'Cần bổ sung','NOT_VERIFIABLE':'Không thể kiểm chứng','WARNING':'Cảnh báo','MISMATCH':'Không khớp','PASS':'Đạt tiêu chí đã kiểm tra',
  'INVALID_INPUT':'Thông tin không hợp lệ. Kiểm tra các trường và thử lại.','INVALID_FILE':'Tệp không hợp lệ. Vui lòng chọn PDF phù hợp.','DUPLICATE_ORDER':'Đơn hàng đã tồn tại. Mở đơn hàng hiện có.','EXISTING_FOLDER_REVIEW_REQUIRED':'Hãy chọn thư mục đơn hàng có sẵn sau khi kiểm tra.','REQUEST_TOO_LARGE':'Yêu cầu vượt giới hạn dung lượng.','PERMISSION_DENIED':'Bạn không có quyền thực hiện thao tác này.','AUTH_REQUIRED':'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.','PASSWORD_CHANGE_REQUIRED':'Vui lòng đổi mật khẩu trước khi vào workspace.','UPSTREAM_UNAVAILABLE':'Không thể kết nối hệ thống. Thử lại với cùng yêu cầu.','CONFIG_REQUIRED':'Hệ thống chưa được cấu hình. Liên hệ quản trị.','AUTH_FAILED':'Không thể đăng nhập. Kiểm tra thông tin và thử lại.','WEAK_PASSWORD':'Mật khẩu cần có ít nhất 12 ký tự.','ACCOUNT_EXISTS':'Tài khoản đã được tạo.','FILE_TOO_LARGE':'Tệp vượt giới hạn dung lượng.'
 }
};
let language=localStorage.getItem('eudr_language')||(/^vi\b/i.test(navigator.language)?'vi':'en');
if(!['en','vi'].includes(language))language='en';
const originalText=new WeakMap();
function t(key,variables={}){let value=translations[language][key]||translations.en[key]||key;return value.replace(/\{(\w+)\}/g,(_,k)=>String(variables[k]??''));}
function translateUI(root=document){
 document.documentElement.lang=language;
 root.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=t(el.dataset.i18n)});
 // Only fixed presentation elements. Never translate table cells, file names, values or source evidence.
 root.querySelectorAll('button, h1, h2, h3, th, legend, option, summary, .sidebar-section, .badge, .status-pill').forEach(el=>{
  if(el.children.length||el.dataset.i18n)return;
  const original=el.dataset.i18nOriginal||el.textContent.trim();
  if(translations.vi[original]){el.dataset.i18nOriginal=original;el.textContent=t(original);}
 });
 root.querySelectorAll('label, p, small').forEach(el=>{
  for(const node of el.childNodes){if(node.nodeType!==Node.TEXT_NODE)continue;
   const original=originalText.get(node)||node.textContent.trim();
   if(!translations.vi[original])continue;
   originalText.set(node,original);
   node.textContent=node.textContent.replace(node.textContent.trim(),t(original));
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
 'Products':'Sản phẩm','Materials':'Vật liệu','Supply Chain':'Chuỗi cung ứng','Add Relationship':'Thêm quan hệ','Edit Relationship':'Sửa quan hệ','No upstream relationship yet for this material.':'Chưa có quan hệ nhà cung cấp cho vật liệu này.','Select or add a material to begin the Supply Chain.':'Chọn hoặc thêm vật liệu để bắt đầu chuỗi cung ứng.',
 'Commercial Shipping':'Thương mại & vận chuyển','FSC Certification':'Chứng nhận FSC','Transport':'Vận chuyển','Geolocation':'Vị trí địa lý',
 'Evidence needs block mapping':'Chứng từ cần phân loại vào khối','Original approved documents':'Chứng từ gốc đã duyệt','AI processed copies':'Bản xử lý bằng AI','Export package':'Xuất bộ chứng từ','Exporting ZIP…':'Đang tạo tệp ZIP…','ZIP is ready.':'Tệp ZIP đã sẵn sàng.','Download ZIP':'Tải ZIP','Export failed.':'Xuất bộ chứng từ thất bại.','Select at least one approved document.':'Chọn ít nhất một chứng từ đã duyệt.',
 'EVIDENCE_BLOCK_REQUIRED':'Cần phân loại chứng từ cũ vào một trong bốn khối trước khi tải lên.'
});
