# Phân tích vận hành Workspace OmniFlow

Workspace cho phép thiết kế automation khi chưa kết nối ví và quản lý nhiều pipeline sau khi xác thực ví. Tài liệu này ghi nhận hiện trạng, thiết kế đề xuất và thứ tự thực hiện. [BRD](REACTIVEFLOW_BUSINESS_REQUIREMENTS_SPEC.md#47-phiên-workspace-và-quyền-thao-tác) · [FRS](REACTIVEFLOW_DETAILED_FRS.md#8-vận-hành-workspace-theo-ví) · [Blueprint](../PROJECT_BLUEPRINT.md)

## 1. Năm màn hình theo trạng thái ví

| Màn hình | Chế độ khách | Sau khi kết nối và xác thực ví |
|---|---|---|
| **Pipeline Studio** | Canvas trống hoặc recipe đã chọn. Cho kéo thả, nối node, cấu hình, validate, lưu nháp cục bộ và export JSON. Các tham số My Connected Wallet và My ActionVault chưa xác định. Deploy hướng dẫn kết nối ví. | Liệt kê canvas theo ví. Cho mở, sửa, đổi tên, nhân bản và lưu nháp. Cho deploy revision hợp lệ vào Vault của ví. Graph của deployment đã xác nhận mở để xem cấu hình, trạng thái và lịch sử. Chỉnh graph tạo revision nháp mới. |
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
