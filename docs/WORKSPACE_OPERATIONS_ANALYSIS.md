# Phân tích vận hành Workspace OmniFlow

Workspace cho phép thiết kế automation khi chưa kết nối ví và quản lý nhiều pipeline sau khi xác thực ví. Tài liệu này ghi nhận hiện trạng, thiết kế đề xuất và thứ tự thực hiện. [BRD](REACTIVEFLOW_BUSINESS_REQUIREMENTS_SPEC.md#47-phiên-workspace-và-quyền-thao-tác) · [FRS](REACTIVEFLOW_DETAILED_FRS.md#8-vận-hành-workspace-theo-ví) · [Blueprint](../PROJECT_BLUEPRINT.md)

## 1. Năm màn hình theo trạng thái ví

| Màn hình | Chế độ khách | Sau khi kết nối và xác thực ví |
|---|---|---|
| **Pipeline Studio** | Hiện danh sách nháp trên trình duyệt. Tạo pipeline hoặc dùng recipe để mở Visual Board. Cho sửa graph, validate, lưu cục bộ và export JSON. Các tham số My Connected Wallet và My ActionVault chưa xác định. Deploy hướng dẫn kết nối ví. | Liệt kê pipeline theo ví. Cho mở, sửa, đổi tên, nhân bản và lưu nháp. Cho deploy revision hợp lệ vào Vault của ví. Graph của deployment đã xác nhận mở để xem cấu hình, trạng thái và lịch sử. Chỉnh graph tạo revision nháp mới. Xem mục 7. |
| **Active Automations** | Hiện CTA kết nối và điều hướng đến Studio hoặc thư viện. Ẩn số pipeline, thẻ gas và dữ liệu demo. | Hiện deployment của ví, lọc theo trạng thái. Mỗi thẻ hiện địa chỉ RSC/Vault, mạng, quỹ phí và kết quả gần nhất nếu có. Cho tiếp tục bước thiếu, refuel và dùng các điều khiển vòng đời đã được contract hỗ trợ và ví có quyền. |
| **Template Library** | Catalog công khai. Cho tìm, lọc, xem chi tiết và Use Recipe để tạo nháp cục bộ. | Vẫn dùng catalog chung. Use Recipe tạo canvas mới theo ví. Các trường phụ thuộc tài khoản điền từ ví/Vault đã xác minh và được kiểm tra trước deploy. Nêu rõ template chỉ dùng thiết kế khi bộ triển khai chưa hỗ trợ. |
| **Vault Manager** | CTA kết nối. Địa chỉ, số dư và quyền RSC chưa xác định. Khóa nạp, rút, cấp quyền và Panic Button. | Tra cứu Vault trên Base Sepolia và xác minh owner. Nếu chưa có Vault, hiện tạo hoặc liên kết khi được hỗ trợ. Khi có Vault, đọc số dư ETH/token và quyền từng RSC. Nạp, cấp/thu hồi quyền và rút khẩn cấp theo khả năng hợp đồng. Hàm emergencyWithdraw hiện rút ETH. Rút một phần hoặc rút ERC-20 cần khả năng riêng. |
| **Activity Logs** | CTA kết nối để xem lịch sử cá nhân. Có thể mở proof demo công khai qua liên kết riêng. | Hiện lịch sử của deployment thuộc ví. Lọc pipeline, mạng, thời gian và kết quả. Liên kết receipt nguồn, Lasna và callback đích. Phân biệt chờ callback, thành công, bỏ qua và thất bại theo bằng chứng. Khi mất stream, giữ lịch sử đã tải của ví hiện tại và báo dữ liệu chưa cập nhật. |

Phân biệt chưa kết nối, chờ xác thực, đang tải, có dữ liệu, kết quả rỗng và lỗi đọc. Chỉ hiện số 0 khi nguồn dữ liệu trả về số 0. RPC đọc theo chain của dữ liệu. Chuyển mạng ví khi cần ký giao dịch.

Kết nối ví cho frontend biết địa chỉ. Đề xuất dùng Sign-In with Ethereum để xác thực phiên cho API và WebSocket bằng chữ ký thông điệp. Backend lấy danh tính từ phiên, kiểm tra quyền trên từng đối tượng và không lưu private key. Khi chuyển A sang B hoặc ngắt ví, hủy request và subscription cũ, xóa dữ liệu A khỏi màn hình và bỏ phản hồi đến muộn. Chỉ nhập nháp khách sang ví khi người dùng chọn. [ERC-4361](https://eips.ethereum.org/EIPS/eip-4361)

## 2. Một ví, nhiều canvas và deployment

| Đối tượng | Dữ liệu chính |
|---|---|
| **Workspace / Vault link** | Ví chuẩn hóa, môi trường, chain ID, địa chỉ Vault và bằng chứng chủ sở hữu. Quyền hiện tại đọc lại từ chain. |
| **Pipeline** | ID ổn định, ví chủ, tên và thời điểm tạo/cập nhật. Workspace có nhiều pipeline. |
| **Revision** | Graph, tham số, vị trí node, số phiên bản. Revision đã deploy giữ nguyên snapshot. |
| **Deployment** | Revision, RSC/Vault kèm chain ID, bước hiện tại, tx hash từng bước, lỗi và khóa chống deploy trùng. |
| **Execution / cursor** | Tham chiếu sự kiện nguồn, phản ứng Lasna và callback đích, kết quả, receipt và mốc đồng bộ từng chain. |

| Trạng thái | Quy tắc vận hành |
|---|---|
| **Bản nháp** | Sửa, nhân bản, export, xóa hoặc validate để bắt đầu deploy. |
| **Đang triển khai** | Hiện bước đang chờ và tx hash đã gửi. Sau reload tiếp tục tiến trình cũ, đối soát trước khi retry. |
| **Chờ thiết lập** | RSC đã deploy, còn thiếu xác nhận, quỹ phí hoặc quyền Vault. Cho tiếp tục đúng bước còn thiếu. |
| **Đang chạy** | Deployment đã xác nhận và đủ điều kiện on-chain. Listening, Evaluating, Executing và Cooldown là diễn tiến thực thi. Triggered là một sự kiện, không thay vòng đời. |
| **Tạm dừng** | Chỉ xác nhận sau receipt. Thu hồi quyền Vault chặn hành động đích, trong khi RSC có thể tiếp tục nhận event và phát sinh phí. Resume cấp lại quyền và kiểm tra quỹ. |
| **Đã dừng / Lưu trữ** | Giữ graph, địa chỉ và lịch sử. Đã dừng cần bằng chứng dừng on-chain, còn lưu trữ là thao tác tổ chức danh sách. Repo chưa có luồng unsubscribe và hoàn gas cho người dùng. |
| **Lỗi triển khai** | Giữ bước lỗi và các tx đã gửi. Retry từ bước an toàn, ví dụ tiếp tục cấp quyền cho RSC đã xác nhận. |

Một pipeline có thể có v1 đang chạy và v2 đang soạn. Chuyển phiên bản cần kiểm soát quyền giữa hai RSC để tránh chạy trùng. Sức khỏe vận hành là trục riêng gồm đủ quỹ, sắp cạn, có nợ và lỗi đọc. Đọc balance, reserves và debt của RSC trên Lasna và của Vault tại callback proxy Base Sepolia. Số ETH dùng để swap trong Vault được hiển thị riêng. [Reactive Network Economy](https://dev.reactive.network/economy)

## 3. Lưu trữ và phục hồi

- **Trình duyệt** lưu nháp khách và cache soạn thảo. Chỉ đồng bộ đa thiết bị sau khi người dùng đưa nháp vào Workspace của ví.
- **PostgreSQL được đề xuất** cho Pipeline, Revision, Vault link, Deployment, lịch sử và cursor. Lưu tiến trình theo từng bước và đối soát receipt khi restart. Nếu kết quả broadcast chưa rõ, tìm giao dịch đã gửi trước khi retry.
- **Blockchain và system contract** xác định địa chỉ, subscription, quyền Vault, tài sản, quỹ phí và receipt. RSC tiếp tục xử lý khi frontend/backend ngừng hoạt động nếu các điều kiện on-chain còn đáp ứng.
- **Indexer và WebSocket** phục vụ Workspace. Indexer đọc bù theo cursor, xử lý reorg và loại trùng theo chain ID, tx hash và log index. Ghép các bước bằng tham chiếu on-chain. WebSocket thông báo theo phiên đã xác thực, client đọc bù lịch sử sau reconnect.

Hiện RSC đã deploy vẫn tồn tại sau restart, nhưng backend chưa lưu đủ dữ liệu để khôi phục Workspace theo ví. Studio giữ graph trong React state, API trả kết quả deploy và Event Listener giữ buffer trong RAM có dữ liệu mẫu. Khi biết địa chỉ hoặc tx hash có thể tra lại giao dịch. Tên, layout và các revision nháp cần dữ liệu lưu ngoài chain. [Studio](../frontend/src/components/canvas/StudioCanvas.tsx) · [API deploy](../backend/src/routes/pipeline.route.ts) · [Event Listener](../backend/src/services/eventListener.service.ts)

## 4. Việc cần làm theo thứ tự

| Ưu tiên | Công việc | Kết quả cần đạt |
|---|---|---|
| P0 | Chế độ khách và cô lập ví | Gỡ owner dự phòng khi deploy, địa chỉ Vault/RSC cố định và số dư mẫu khỏi Workspace cá nhân. Reset dữ liệu khi đổi ví. Chặn deploy tại UI và API khi thiếu quyền. |
| P0 | Xác thực và phân quyền | SIWE với nonce dùng một lần và hạn phiên. REST và WebSocket kiểm tra ví từ phiên. Đối chiếu quyền Vault qua RPC trước khi liên kết hoặc deploy. |
| P1 | Kho Workspace | Tạo schema Pipeline/Revision/VaultLink/Deployment. Lưu nháp khách, hỗ trợ nhập nháp và mở Workspace từ thiết bị khác. |
| P1 | Deploy phục hồi được | Validate node được hỗ trợ, lưu job và tx ở từng bước, chống gửi trùng, tiếp tục nạp phí/cấp quyền sau reload và restart. |
| P1 | Active và Vault đọc đúng địa chỉ | Đọc số liệu từ từng RSC/Vault, cập nhật theo receipt và đưa thao tác vòng đời lên UI khi capability thực tế hỗ trợ. Liên quan Task 329. |
| P2 | Lịch sử bền vững | Thay buffer mẫu bằng indexer có cursor, ghép đúng receipt, phân quyền stream và đọc bù. Liên quan Task 327. |
| P2 | Dừng và chuyển phiên bản | Làm rõ cơ chế unsubscribe và khoản phí có thể hoàn trước khi triển khai Terminate & Refund. Kiểm thử chuyển revision đang chạy và quyền người gọi. |

## 5. Nghiệm thu

1. Khách dùng recipe, sửa graph, reload vẫn còn nháp và không thể deploy hay thao tác Vault.
2. Ví A lưu hai canvas, một nháp và một đã deploy. Thiết bị khác tải lại đúng cả hai sau khi xác thực cùng ví.
3. Đổi từ A sang B khi request A chưa hoàn tất. Không hiện dữ liệu A và không nhận stream riêng của A. Khi ngắt ví, về chế độ khách.
4. Sửa revision mới trong khi revision cũ chạy. Graph đã deploy giữ nguyên. Reload giữa deploy và cấp quyền khôi phục bước đang dở mà không tạo RSC trùng.
5. RPC lỗi, số dư bằng 0 và ví sai mạng có trạng thái khác nhau. Thao tác cần ký chỉ mở đúng mạng và đúng quyền.
6. Tắt frontend và backend, phát event nguồn khi RSC đủ điều kiện. Sau restart, ví A tìm được pipeline, graph và trọn chuỗi receipt được đọc bù, mỗi sự kiện xuất hiện một lần.

## 6. Kế hoạch triển khai Supabase cho Workspace

**Phạm vi MVP.** Dùng Supabase làm PostgreSQL cho dữ liệu Workspace. Giữ Express trên Railway làm API và giữ WebSocket hiện tại. Frontend gọi Express bằng phiên xác thực ví. Backend nắm thông tin kết nối database. Supabase Auth, Realtime và Storage nằm ngoài phạm vi MVP. Reactive Omni và ActionVault tiếp tục thực thi theo trạng thái on-chain khi database tạm gián đoạn.

### 6.1 Môi trường và phân quyền

- Chuẩn bị database local và dự án Supabase riêng cho môi trường testnet. Đưa SQL migrations vào `supabase/migrations/`. CI áp migration trên DB sạch để kiểm tra schema. Áp migration lên testnet trước khi rollout backend tương thích. Dùng thay đổi bổ sung trong giai đoạn chuyển đổi để có thể quay lại bản backend trước. [Supabase Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- Cấu hình `DATABASE_URL` bằng Railway Variables. Kiểm tra đường kết nối từ container Railway, dùng TLS và giới hạn connection pool. Chọn kết nối trực tiếp nếu hạ tầng hỗ trợ hoặc dùng Supavisor session mode khi cần kết nối IPv4 cho Express chạy lâu dài. Tách role chạy migration và role runtime giới hạn quyền. [Supabase PostgreSQL Connections](https://supabase.com/docs/guides/database/connecting-to-postgres)
- Lưu bảng Workspace trong schema riêng, ngoài danh sách schema được Data API phơi bày. Runtime role chỉ có quyền cần thiết. Express thực thi phân quyền ở lớp truy vấn theo địa chỉ ví chuẩn hóa và môi trường lấy từ phiên SIWE. Kiểm tra chữ ký, domain, nonce dùng một lần và hạn phiên. Áp cùng phạm vi cho WebSocket, từ chối subscribe pipeline của ví khác và đóng subscription khi phiên hết hiệu lực.
- Giữ khóa riêng người dùng trong ví. Xác minh `owner()` qua RPC trước khi liên kết Vault hoặc chuẩn bị deploy cho Vault đó. Việc cấp quyền Vault vẫn cần giao dịch do chủ Vault ký.

### 6.2 Schema tối thiểu

| Bảng | Dữ liệu chính | Ràng buộc cần có |
|---|---|---|
| `pipelines` | ID, ví chủ, môi trường, tên, thời điểm tạo/cập nhật, thời điểm lưu trữ | Index theo ví và môi trường để liệt kê nhanh. |
| `pipeline_revisions` | Pipeline ID, số revision, graph và layout dạng JSONB, phiên bản schema graph | Duy nhất theo pipeline và số revision. Revision đã gửi deploy trở thành snapshot bất biến. Dùng version để phát hiện ghi đè nháp từ nhiều tab. |
| `vault_links` | Ví chủ, chain ID, địa chỉ Vault, thời điểm và bằng chứng đã kiểm tra owner | Duy nhất theo chain và địa chỉ Vault. Đọc lại quyền từ chain trước thao tác đặc quyền. |
| `deployments` | Revision và Vault link, chain ID, RSC, bước hiện tại, trạng thái, khóa idempotency, tx hash và lỗi theo bước | Khóa ngoại và kiểm tra cùng phạm vi ví/môi trường. Khóa idempotency theo ví/môi trường. Địa chỉ RSC duy nhất theo chain khi đã xác định. |

Lưu nonce và phiên SIWE bằng cơ chế có khả năng xác minh và thu hồi sau restart. Nếu backend chọn lưu trong DB, dùng bảng riêng với thời hạn. Giai đoạn lịch sử bổ sung `executions` để ghép receipt liên chuỗi và `chain_cursors` để tiếp tục đọc sau restart. Lưu nhận dạng log theo `chainId + txHash + logIndex` và cursor theo indexer/chain.

### 6.3 Các giai đoạn triển khai

| Giai đoạn | Thay đổi | Điều kiện qua giai đoạn |
|---|---|---|
| **1. Kết nối DB và thiết lập quyền** | Migration cho schema MVP, cấu hình backend, kiểm tra connectivity và readiness riêng cho chức năng lưu trữ. Thêm phiên SIWE và truy vấn giới hạn theo ví. | CI áp được migration trên DB sạch. Ví B không đọc hoặc sửa dữ liệu A qua API hay đăng ký stream riêng của A. |
| **2. Lưu canvas và liên kết Vault** | API tạo/liệt kê Pipeline, đọc và lưu nháp, tạo revision, liên kết Vault có kiểm tra owner. Giữ nháp khách trong trình duyệt và chỉ nhập nháp khi người dùng chọn. Gắn Studio, Active và Vault với API theo ví. | A có thể lưu hai canvas, mở từ thiết bị khác và đổi sang B mà dữ liệu A không còn xuất hiện. Xung đột phiên bản nháp trả lỗi rõ thay vì ghi đè. |
| **3. Khôi phục luồng deploy** | API dùng khóa idempotency, khóa hoặc cập nhật có điều kiện để chỉ một worker nhận bước. Ghi ý định gửi giao dịch trước khi broadcast. Lưu hash, chain và dữ liệu đối soát theo từng bước deploy, nạp phí và cấp quyền. Cho UI mở lại Deployment sau reload. | Restart ngay sau broadcast vẫn xác định được giao dịch đã gửi. Retry từ bước còn thiếu và không tạo RSC thứ hai. RUNNING chỉ xuất hiện sau khi đối soát quyền và quỹ on-chain. |
| **4. Lịch sử và đọc bù** | Thêm indexer, lưu execution và cursor theo từng chain. Chỉ tiến cursor sau khi sự kiện đã được ghi bền vững. Thay buffer mẫu bằng lịch sử theo ví. Backfill và đối soát reorg, gửi thông báo WebSocket sau khi ghi DB. | Restart backend, phát sinh giao dịch trong lúc backend tắt và mở lại Workspace. Lịch sử phục hồi đủ các bước, mỗi sự kiện xuất hiện một lần. |

**Trường hợp kết quả broadcast chưa rõ.** Với giao dịch backend ký, lưu dữ liệu có thể đối soát trước khi gửi, chẳng hạn hash của giao dịch đã ký và thông tin signer/nonce. Khi không xác định được kết quả, đưa bước về trạng thái cần đối soát. Chỉ gửi lại cùng giao dịch hoặc tiếp tục sau khi xác minh trạng thái on-chain. Với bước do ví người dùng ký, lưu hash khi nhận được và kiểm tra quyền hoặc receipt nếu bị gián đoạn giữa lúc ký và lúc cập nhật giao diện.

**Chuyển dữ liệu hiện có.** Chỉ liên kết deployment cũ khi có graph hoặc metadata hợp lệ, địa chỉ RSC/Vault, bằng chứng deployment và quyền sở hữu Vault. Để Workspace trống nếu không có dữ liệu đủ điều kiện. Dữ liệu proof công khai vẫn truy cập qua trang riêng.

**Sự cố và kiểm tra trước rollout.** Khi Supabase lỗi, báo không tải hoặc lưu được Workspace, giữ nháp cục bộ và giữ lịch sử đã tải của đúng ví với thời điểm cập nhật. Tạm ngừng bắt đầu deploy mới nếu chưa ghi được job. Theo dõi lỗi DB, deployment kẹt theo bước và độ trễ indexer. Kiểm tra backup và diễn tập khôi phục sang DB test, sau đó thử khôi phục quan hệ ví–canvas–revision–deployment và tiến trình deploy còn dở.

## 7. Pipeline Studio mở bằng danh sách pipeline

### 7.1 Phù hợp nghiệp vụ và phạm vi

Hiện `/workspace/studio` mở thẳng một canvas khởi tạo từ graph mặc định. Người dùng thiếu nơi tìm lại bản nháp hoặc chọn giữa nhiều canvas. Đề xuất giữ năm mục Workspace và đưa Visual Board thành màn hình con của Pipeline Studio. Danh sách là điểm vào mặc định. Tạo mới, Use Recipe và đường dẫn đến một revision có thể mở thẳng editor. [Studio route](../frontend/src/app/workspace/studio/page.tsx) · [StudioCanvas](../frontend/src/components/canvas/StudioCanvas.tsx)

| Màn hình | Đơn vị hiển thị | Trách nhiệm |
|---|---|---|
| **Pipeline Studio** | Một dòng theo Pipeline | Tìm, lọc, mở, đổi tên, nhân bản và lưu trữ pipeline. Tóm tắt bản nháp và revision có deployment. |
| **Visual Board** | Một Revision thuộc Pipeline | Sửa graph của bản nháp, kiểm tra, lưu và bắt đầu deploy. Xem snapshot đã deploy ở chế độ chỉ đọc, có thể tạo nháp từ snapshot đó. |
| **Active Automations** | Một Deployment của Revision | Xem RSC, Vault, quỹ phí, lịch sử thực thi và trạng thái đã đối soát. Tiếp tục thiết lập, Refuel, Pause và Resume theo quyền và khả năng deployment. |

Ví dụ, ETH Stop-Loss có **v1 đang chạy** và **v2 đang soạn**. Studio hiển thị một dòng với cả hai thông tin. Mở mặc định vào v2. Thao tác **Xem bản đang chạy** mở snapshot v1 hoặc deployment v1 trong Active. Lưu v2 chỉ cập nhật revision nháp. Studio và Active dùng cùng nguồn trạng thái deployment để hai màn hình hiển thị nhất quán.

### 7.2 Luồng danh sách và Visual Board

- Danh sách MVP hiển thị tên, lần sửa gần nhất, bản nháp và revision đang chạy nếu có. Bộ lọc gồm **Tất cả**, **Có bản nháp**, **Có deployment** và **Đã lưu trữ**. Các bộ lọc có thể giao nhau. Phân biệt đang tải, danh sách rỗng và lỗi đọc.
- **Khách** có thể tạo, mở, sửa, nhân bản, export và xóa nháp trên trình duyệt. Nếu danh sách rỗng, hiện **Tạo pipeline** và **Dùng template**. Deploy hướng dẫn kết nối và xác thực ví.
- **Ví đã xác thực** tải danh sách từ API theo ví và môi trường. Cho nhập nháp cục bộ khi người dùng chọn. Khi đổi ví hoặc ngắt kết nối, đóng graph riêng của ví cũ và bỏ phản hồi tải đến muộn.
- **Mở pipeline** chọn nháp gần nhất nếu có. Nếu chỉ có snapshot đã deploy, mở chế độ xem và hiện **Tạo bản nháp từ phiên bản này**. Editor hiển thị tên, revision, trạng thái lưu và đường quay lại danh sách. Khi tải graph lỗi hoặc thiếu quyền, hiển thị lỗi tương ứng. Khi còn thay đổi chưa lưu, cho lưu hoặc xác nhận trước khi rời editor.
- **Use Recipe** tạo một pipeline nháp mới trong Workspace hoặc trên trình duyệt, tùy phiên, rồi mở ngay Visual Board. Tải lại URL editor phải mở lại nháp đã tạo, tránh tạo bản sao từ cùng thao tác điều hướng. Khi quay lại danh sách, nháp đã xuất hiện.
- Xóa nháp chỉ xóa revision nháp theo quyền. Lưu trữ pipeline chỉ thay đổi danh sách. Việc dừng deployment đang chạy được thực hiện trên chain và theo khả năng hợp đồng.

### 7.3 Tác động kỹ thuật và thứ tự thực hiện

1. **Tách route và tái sử dụng canvas.** Giữ `/workspace` chuyển đến `/workspace/studio` và dùng route đó cho danh sách. Đề xuất `/workspace/studio/[pipelineId]` cho editor, kèm `revisionId` khi mở một snapshot cụ thể. Sidebar giữ trạng thái chọn Studio trên cả hai route. `StudioCanvas` nhận graph theo revision và nạp lại khi đổi đối tượng. Tái sử dụng palette, inspector và validation hiện có. [Workspace redirect](../frontend/src/app/workspace/page.tsx) · [Sidebar](../frontend/src/components/common/Sidebar.tsx)
2. **Hoàn thiện nháp cục bộ và tương thích điều hướng.** Gán ID ổn định cho nháp khách. Đổi Use Recipe và CTA tạo pipeline sang luồng tạo nháp rồi mở editor. Giữ đường dẫn `/workspace/studio?recipe=...` hoạt động trong giai đoạn chuyển đổi. Bước này có thể làm trước Supabase. [Template Library](../frontend/src/app/workspace/templates/page.tsx) · [Active Automations](../frontend/src/app/workspace/active/page.tsx)
3. **Đồng bộ theo ví với Supabase.** Dùng `pipelines` và `pipeline_revisions` qua Express. API xác thực quyền đọc và ghi theo ví, xử lý ghi đè giữa nhiều tab và cho nhập nháp khách. Chỉ cung cấp đồng bộ đa thiết bị sau khi dữ liệu đã được lưu bền vững theo mục 6.
4. **Gắn deploy với revision đã lưu.** Truyền ID revision để backend gắn deployment, RSC và receipt vào đúng snapshot. Studio hiển thị trạng thái tóm tắt, Active mở đúng deployment và có liên kết về snapshot. Thay đổi route và mô hình lưu trữ này thực hiện ở frontend/backend.

### 7.4 Nghiệm thu

1. Khách vào Studio thấy danh sách hoặc trạng thái rỗng. Dùng recipe tạo một nháp, sửa graph, quay về danh sách và reload. Mở lại nháp cho đúng node, cạnh và tham số đã lưu.
2. Đi thẳng từ URL editor, quay lại danh sách và dùng nút Back. URL recipe cũ mở được graph đúng mẫu. Reload editor không tự tạo thêm pipeline.
3. Ví A lưu nhiều canvas và mở cùng dữ liệu trên thiết bị khác. Khi đổi sang ví B trong editor, graph của A biến mất và đường dẫn riêng của A không tải được bằng phiên B.
4. Deploy v1 rồi tạo nháp v2. Studio hiện một dòng với v1 đang chạy và v2 đang soạn. Active trỏ đến deployment v1. Mở v1 là chỉ đọc. Sửa hoặc xóa nháp v2 không thay đổi cấu hình v1.
5. Reload giữa deploy và cấp quyền. Mở lại đúng pipeline và bước còn thiếu. Thử lại không tạo RSC trùng và không mất liên kết với snapshot.

## 8. Demo stop-loss với hai kết quả được xác minh bằng receipt

### 8.1 Phạm vi và thứ tự thực hiện

Ưu tiên cho demo Set It and Forget It trước AI Copilot và Telegram. Dùng lại một pipeline **Watch DEX Price → Price Threshold Guard → Cooldown Guard → DEX Swap** trên Base Sepolia → Lasna → Base Sepolia. Origin và Vault dùng cùng pool thử nghiệm, ngưỡng giá cố định và một lần xác nhận giá. Luồng này dùng các node và hợp đồng hiện có. Cross-chain trigger và price-velocity trigger bỏ qua kiểm tra ngưỡng tĩnh ở Vault, vì vậy nằm ngoài kịch bản này. [Kiểm tra giá tại Vault](../PROJECT_BLUEPRINT.md#45-pattern-3-live-price-re-validation-pattern-tái-thẩm-định-giá-tức-thời-chống-stale-trigger) · [RSC](../contracts/src/StopLoss_Pipeline.sol) · [Vault](../contracts/src/ActionVault.sol)

| Bước | Ước tính | Kết quả cần có |
|---|---:|---|
| Mở rộng script xác minh | 0,5–1 ngày | Xác minh được cả `OrderSkipped` và `StopLossExecuted`, giữ được cách kiểm chứng receipt thành công hiện tại. |
| Chạy trên testnet | 0,5–1 ngày | Hai kết quả trên cùng một deployment, mỗi lượt có đủ ba receipt và đúng giá trị nghiệp vụ. |
| Màn hình mở lại deployment | 1–2 ngày | Cùng ví và trình duyệt mở lại đúng pipeline, xem Vault, gas Lasna và hai lượt đã xác minh. |

Tổng **2–4 ngày công** nếu RPC, signer thử nghiệm và quỹ testnet sẵn sàng. Dành tối đa một ngày cho việc thu được receipt `OrderSkipped` sau khi script có thể xác minh nó. Nếu hết khung thử mà vẫn thiếu receipt, ghi lại lỗi và hash đã có, giữ nhánh bỏ qua ở trạng thái chưa xác minh và tiếp tục nghiệm thu nhánh thực thi hiện hữu. Đồng bộ đa thiết bị, phục hồi deploy và lịch sử tự động thuộc [TASK-333 đến TASK-336](../TASKS.md#task-333-todo--xác-thực-và-phân-quyền-workspace-theo-ví).

### 8.2 Thiết lập và chạy hai lượt testnet

1. **Kiểm tra trước khi gửi giao dịch.** Dùng ví, pool và token thử nghiệm, Vault và RSC của riêng demo. Đọc lại chain ID, bytecode, owner và quyền RSC trên Vault, pool nguồn và pool dùng để đọc giá tại Vault. Kiểm tra ETH của signer, ETH trong Vault, phí giao callback và lREACT của RSC. Giữ lại cấu hình địa chỉ, ngưỡng, tỷ lệ swap, cooldown và hash liên kết deployment.
2. **Bỏ qua khi giá hồi.** Tạo `Sync` dưới ngưỡng để RSC yêu cầu callback, rồi đưa reserves của pool thử nghiệm về mức trên ngưỡng trước khi Vault đọc. Đưa hai giao dịch đổi reserves gần nhau và kiểm tra thứ tự theo receipt. Việc đợi Lasna xác nhận rồi mới gửi giao dịch hồi có thể khiến callback đến trước. Điều kiện đạt là log giảm tham chiếu đúng trong receipt Lasna, proxy giao đúng callback và Vault phát `OrderSkipped` với giá trên ngưỡng, không có payout token trong receipt đó. Giá hồi mà RSC chưa yêu cầu callback là trường hợp khác.
3. **Thực thi khi giá vẫn dưới ngưỡng.** Chờ hết cooldown đã cấu hình, đối chiếu số dư và giữ giá dưới ngưỡng đến khi callback settle. Dùng cùng RSC/Vault để chạy lượt tiếp theo. Điều kiện đạt là Vault phát `StopLossExecuted` và receipt có `Transfer` token đầu ra đến owner với amount đạt `minUsdcOut`.
4. **Giữ một lượt đang đối soát trên mỗi cặp RSC/Vault.** Ghi hash origin ngay khi có. Chỉ bắt đầu lượt tiếp theo sau khi đã phân loại lượt trước hoặc dừng để điều tra. Tránh dùng receipt cũ để bù một lượt thiếu bằng chứng.

### 8.3 Xác minh và lưu bằng chứng

- Mở rộng [`scripts/test-full-loop.ts`](../scripts/test-full-loop.ts) để nhận kết quả kỳ vọng cho mỗi lượt. Giữ chế độ đọc lại hash và đường chạy xác minh nhánh thực thi hiện có. Kiểm tra source receipt có đúng pool, topic và log index. Đối chiếu `refTx`, chain, event index trong receipt Lasna, callback của đúng RSC và cấu hình `CallbackRequest` của system contract.
- Ưu tiên bản ghi giao callback từ Lasna, sau đó kiểm tra receipt và calldata của proxy đích. Khi chỉ mục chưa trả bản ghi, quét cả hai event Vault trong cửa sổ block giới hạn, rồi đối chiếu proxy, địa chỉ đích và payload có địa chỉ RSC được chèn. Payload giống nhau có thể xuất hiện ở nhiều lần chạy. Nếu còn nhiều ứng viên hoặc phạm vi quét chưa đủ để xác định duy nhất, hiển thị đang đối soát và không gán receipt cho lượt chạy.
- Phân loại theo log nghiệp vụ của đúng Vault. `SKIPPED` cần `OrderSkipped`, lý do và giá đọc lại. `EXECUTED` cần `StopLossExecuted` và payout hợp lệ trong cùng receipt. Receipt success đơn lẻ không đủ. Nếu proxy phát `CallbackFailure`, giao dịch revert hoặc thiếu event dự kiến, ghi rõ lỗi hay kết quả chưa xác minh. Nếu RPC hết thời gian chờ, giữ trạng thái đang đối soát và các hash đã biết.
- Lưu bằng chứng theo từng `originTxHash` và log index trong [`FULL_LOOP_EVIDENCE.json`](../FULL_LOOP_EVIDENCE.json), gắn với deployment và revision khi có. Ghi chain IDs, pool, RSC, Vault, proxy, ba hash, block/log index, ngưỡng, kết quả, thời điểm xác minh và giá hoặc số lượng tương ứng. Landing hiển thị mục `demo`, các lượt bổ sung nằm trong `fullLoops` và ca cooldown nằm trong `cooldowns`. Dữ liệu demo dùng receipt thật.

### 8.4 Workspace và nghiệm thu UI

- Khi deploy đã xác nhận, giữ liên kết `pipelineId`/revision với chain, địa chỉ RSC, Vault và hash deploy/cấp quyền. Bản demo có thể lưu tham chiếu theo ví và môi trường trên cùng trình duyệt. Lúc mở lại, đọc owner của Vault, Vault đích của RSC và quyền callback qua RPC trước khi hiển thị trạng thái. Cache cục bộ chỉ dùng để tìm deployment. Khi đổi ví, ngắt kết nối hoặc đổi deployment, xóa trạng thái đang hiển thị và bỏ kết quả RPC đến muộn.
- Đọc ETH trong Vault trên Base Sepolia và lREACT tại RSC trên Lasna. Hiển thị số 0 sau khi đọc thành công. Tách trạng thái đang tải, lỗi RPC và cấu hình sai. Nếu dùng kết quả lần đọc gần nhất, ghi thời điểm đọc và trạng thái chưa cập nhật. Refuel theo địa chỉ deployment thuộc `TASK-329`.
- Hiển thị lịch sử giới hạn của hai lượt đã xác minh, phân theo deployment. Mỗi dòng có kết quả nghiệp vụ, lý do và giá nếu bỏ qua, số lượng swap và token thực nhận nếu thực thi, cùng link cho từng bước có hash. Ghi rõ phạm vi lịch sử đã xác minh. Nghiệm thu bằng cách đóng app sau deploy, chạy hai lượt, mở lại bằng cùng ví để thấy đúng deployment, rồi đổi sang ví khác để kiểm tra cô lập dữ liệu.

### 8.5 Sự cố và cách giới hạn ảnh hưởng

| Lỗi có thể gặp | Cách xử lý |
|---|---|
| Callback đến trước giao dịch hồi, hoặc cooldown chặn lượt mới | Kiểm tra thứ tự receipt, xác nhận RSC đã yêu cầu callback cho log giảm và chờ cooldown kết thúc. Chỉ thử lại với mức quỹ nhỏ và số lượt giới hạn trên deployment demo. |
| Sai chain, sai RSC/Vault/pool, mất quyền hoặc thiếu phí | Dừng trước khi phát sinh giao dịch mới. Đọc lại cấu hình và trạng thái on-chain, báo đúng bước thiếu. Nạp phí hoặc cấp quyền chỉ cho địa chỉ demo đã xác định. |
| RPC chậm, trả 429, chưa lập chỉ mục hoặc receipt đổi do reorg | Giới hạn phạm vi quét và số request, retry có backoff. Đối chiếu lại receipt và block hash trước khi ghi kết luận. Khi thiếu dữ liệu, giữ hash và cho thử đọc lại. |
| Proxy trả success ở cấp giao dịch nhưng Vault lỗi, hoặc nhiều callback có cùng calldata | Kiểm tra event lỗi của proxy, log đúng Vault và payout. Dùng tham chiếu origin và bản ghi hệ thống để phân biệt. Giữ trạng thái chưa xác minh nếu không thể ghép duy nhất. |
| Reload hoặc mất phản hồi ngay sau broadcast | Lưu hash và kiểm tra receipt/nonce hoặc trạng thái chain trước khi thử lại. Việc mở lịch sử và tải lại trang chỉ đọc dữ liệu. |
| Ảnh hưởng pool, dữ liệu hoặc cấu hình đang dùng | Giữ driver thay đổi reserves trong script testnet chạy chủ động. Dùng pool/Vault/RSC và cấu hình riêng. UI ở chế độ đọc với deployment demo, không đưa bản ghi demo vào stream mặc định của Workspace cá nhân. Triển khai trước trên môi trường preview và kiểm tra build, luồng stop-loss hiện hữu cùng các URL evidence. |
| Nghiệm thu preview thất bại | Tạm ẩn điểm vào demo mới hoặc khôi phục bản preview trước. Giữ bằng chứng và deployment cũ để đối chiếu. Nếu cần ngừng automation demo, thu hồi quyền callback trên Vault demo qua ví owner sau khi kiểm tra giao dịch đang chờ. |

---

## 9. Tiến độ thực hiện các cải tiến UI Workspace (Cập nhật 20/11/2026)

Tuân thủ nguyên tắc **Zero Mock Data** (dữ liệu thật on-chain, trạng thái rỗng/lỗi rõ ràng khi chưa có dữ liệu hoặc mất kết nối), các hạng mục cải tiến giao diện theo đặc tả đã được triển khai và ghi nhận:

| Hạng mục | Màn hình | Hiện trạng triển khai | Ghi chú kỹ thuật |
|---|---|---|---|
| **Bộ lọc nghiệp vụ (All / Drafts / Active / Archived)** | Pipeline Studio | ✅ Hoàn thành | Đã chuyển từ lọc nguồn kỹ thuật (Local/Wallet) sang phân loại trạng thái nghiệp vụ theo Mục 7.2. Tự động liên kết danh sách deployments on-chain của ví vào thẻ Active. |
| **Thao tác Lưu trữ (Archive / Restore Pipeline)** | Pipeline Studio | ✅ Hoàn thành | Thêm mục `Archive pipeline` / `Restore pipeline` vào menu kebab trên từng card. Bộ lọc `Archived` hiển thị danh sách đã lưu trữ. |
| **Gợi ý nhập nháp khách vào ví (Guest-to-Wallet Import)** | Pipeline Studio | ✅ Hoàn thành | Banner xuất hiện khi ví kết nối và có bản nháp cục bộ trên máy. Thao tác `Import to Wallet` gọi API lưu vào tài khoản ví qua phiên SIWE, có nút `Dismiss`. |
| **Chế độ Read-only cho Deployed Snapshot + Tạo v2** | Pipeline Studio (Canvas) | ✅ Hoàn thành | Khóa chỉnh sửa, kéo thả, nối dây khi mở deployment snapshot. Banner thông báo trực quan kèm nút `Create Editable Draft (v2)` để nhân bản sang bản nháp mới. |
| **Cảnh báo thay đổi chưa lưu (Unsaved Changes)** | Pipeline Studio (Canvas) | ✅ Hoàn thành | Tích hợp sự kiện `beforeunload` chặn đóng/rời trang khi canvas đang có chỉnh sửa chưa lưu. |
| **Nút điều khiển vòng đời: Pause / Resume Automation** | Active Automations | ✅ Hoàn thành | Nút bấm trực tiếp gọi `setAuthorizedRSC(rsc, false)` để tạm dừng (Pause) hoặc `setAuthorizedRSC(rsc, true)` để khôi phục (Resume) quyền thực thi của RSC trên ActionVault Base Sepolia. |
| **Badge sức khỏe vận hành (Health Metrics)** | Active Automations | ✅ Hoàn thành | Đọc telemetry on-chain và phân loại trực quan: `HEALTHY` (xanh lá), `LOW RESERVE` (vàng khi quỹ < 0.002 ETH hoặc < 0.005 lREACT), `DEBT OUTSTANDING` (đỏ khi có nợ phí callback/reactive). |
| **Liên kết mở snapshot đang chạy** | Active Automations | ✅ Hoàn thành | Nút `Open in Studio` mở thẳng URL deployment snapshot ở chế độ Read-only để đối soát cấu hình. |
| **Form liên kết ActionVault thủ công** | Vault Manager | ✅ Hoàn thành | Khi ví kết nối chưa có deployment hoặc muốn liên kết một Vault có sẵn, UI cung cấp form nhập địa chỉ ActionVault và xác minh quyền `owner` trực tiếp on-chain qua RPC Base Sepolia. |
| **Nút mở Public Proofs / Demo Evidence** | Activity Logs | ✅ Hoàn thành | Thêm nút điều hướng nhanh `Public Proofs` trên thanh header dẫn tới bảng chứng thực on-chain 3 giao dịch (`FULL_LOOP_EVIDENCE.json`) cho giám khảo. |
| **Chỉ báo Stale Data khi mất stream WebSocket** | Activity Logs | ✅ Hoàn thành | Hiển thị banner cảnh báo dữ liệu cũ kèm mốc thời gian đồng bộ cuối cùng (`Last synced at HH:MM:SS`) và nút `Sync now` khi WebSocket chuyển sang chế độ Polling/Disconnect. |
| **Chuyển nhanh mạng Base Sepolia (1-Click Switch)** | Toàn bộ Workspace | ✅ Hoàn thành | Tích hợp banner cảnh báo sai mạng kèm nút chuyển mạng tự động (`Switch to Base Sepolia`) trên cả Active, Logs và Vault. |
