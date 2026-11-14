DotNexus UI Design System & Aesthetic Blueprint

  │ Tactical Obsidian & Precision Angular Cybernetics
  │ Bản đặc tả ngôn ngữ thiết kế, bảng màu, typography, khối hình học sắc cạnh (Zero-Radius) và bộ thành phần UI dành cho sản phẩm mới.
  ──────
  ## 1. Triết lý Thiết kế (Design Philosophy)

  DotNexus định hình phong cách Tactical High-Density Cybernetics / Mission Control Console:

  • Zero-Radius Geometry (Góc cạnh tuyệt đối): Toàn bộ nút bấm, thẻ thông tin (card), badge, input, popover và thanh cuộn đều loại bỏ bo tròn
  (border-radius: 0px / rounded-none). Mọi khối hình đều mang tính cơ khí chính xác (machined precision).
  • Obsidian Deep Layering: Không gian màu đen ánh tím thẫm nhiều tầng (multi-tiered obsidian surfaces) tạo chiều sâu không gian mà không làm
  chói mắt, tôn vinh các chỉ số dữ liệu thời gian thực.
  • Chấm phá vi mạch (Angular Accents): Sử dụng các chi tiết ngàm góc L-bracket (.tech-corner-accent), đường viền 1px siêu mảnh (hairline 1px
  borders), và đèn báo trạng thái hình vuông (square status pips).
  • Craft Floor Compliance: Độ tương phản khắt khe $\ge 4.5:1$, loại bỏ hoàn toàn "ghost cards" (không dùng viền mờ nhạt kết hợp shadow mềm kiểu
  generic AI), dữ liệu số luôn dùng tabular-nums tránh giật layout.
  ──────
  ## 2. Hệ Thống Màu Sắc (Color Tokens System)

    +---------------------------------------------------------------------------------+
    |                                 CORE PALETTE                                    |
    |                                                                                 |
    |  [ #06040A ] Deep Obsidian Base (Nền không gian vũ trụ sâu nhất)                |
    |  [ #0B0813 ] Surface Obsidian (Nền card, bảng điều khiển chính)                 |
    |  [ #110C1E ] Elevated Layer (Khối nổi, hover container, thanh menu)             |
    |  [ #171028 ] Highlight Interactive (Vùng active, focus input)                   |
    |                                                                                 |
    |  [ #1C142E ] Hairline Subtle Border (Đường viền ngăn cách mặc định 1px)         |
    |  [ #2E1F4A ] Focus Mid Border (Đường viền khi hover/focus)                      |
    |  [ #8B5CF6 ] Electric Violet Accent (Màu chủ đạo tương tác / CTA chính)         |
    |  [ #C084FC ] Light Amethyst / Lilac (Text highlight, icon trạng thái phụ)       |
    |                                                                                 |
    |  SEMANTIC STATUS (High-Voltage Neon):                                           |
    |  [ #00FF9D ] Telemetry Emerald (Active / Healthy / Nominal / 100% Ok)           |
    |  [ #F59E0B ] Tactical Amber (Warning / Syncing / Latency Lag)                   |
    |  [ #EF4444 ] Fencing Rose/Red (Critical Alert / Danger / Slashing)              |
    |  [ #E6007A ] Substrate Pink (Runtime Engine A)                                  |
    |  [ #6366F1 ] EVM Indigo (Runtime Engine B)                                      |
    +---------------------------------------------------------------------------------+

  ### 2.1. Bảng mã màu Hex & Biến CSS

   Token Name                             │ Hex Code                              │ Ứng dụng cụ thể
  ────────────────────────────────────────┼───────────────────────────────────────┼─────────────────────────────────────────────────────────────
   --bg-obsidian-deep                     │ #06040A                               │ Nền canvas, viewport bao quanh trang web, nền header
   --bg-obsidian-surface                  │ #0B0813                               │ Nền các khối Card, Container, Terminal drawer
   --bg-obsidian-elevated                 │ #110C1E                               │ Nền button thứ cấp, thanh tab đang được chọn, drawer popout
   --bg-obsidian-highlight                │ #171028 / #1A102E                     │ Hiệu ứng Hover card, Dropdown popup items
   --border-subtle                        │ #1C142E                               │ Viền hairline 1px ngăn cách layout, viền block
   --border-focus                         │ #2E1F4A                               │ Viền badge, viền button ghost, trạng thái resting
   --border-active                        │ #8B5CF6                               │ Viền button khi hover, viền tab đang active
   --brand-violet                         │ #8B5CF6                               │ Nút bấm Primary, glow shadow, liên kết quan trọng
   --brand-amethyst                       │ #C084FC                               │ Tiêu đề phụ, icon accent, highlight chip
   --neon-emerald                         │ #00FF9D                               │ Đèn trạng thái hoạt động tốt, số liệu tăng trưởng
   --tactical-amber                       │ #F59E0B                               │ Cảnh báo tải cao, độ trễ mạng
   --danger-rose                          │ #EF4444 / #16080E                     │ Nút khẩn cấp, trạng thái lỗi nghiêm trọng
  ──────
  ## 3. Typography & Data Formatting

  DotNexus ứng dụng quy tắc phân tách nghiêm ngặt giữa Nhãn hiển thị (Display) và Dữ liệu phân tích (Telemetry Data):

  1. Monospace (Font chính cho toàn bộ thông số, badge, button, mã lệnh):
      • Font stack: 'JetBrains Mono', 'IBM Plex Mono', 'Fira Code', monospace
      • Thuộc tính bắt buộc:
        font-feature-settings: 'tnum' 1, 'zero' 1;
        letter-spacing: -0.015em;

      • Tác dụng: Các con số khi nhảy realtime không làm co giãn chiều rộng cột (tabular-nums). Số 0 có dấu gạch chéo phân biệt với chữ O
      (slashed-zero).
  2. Display Sans (Tiêu đề lớn, Hero section):
      • Font stack: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif
      • Thuộc tính: letter-spacing: -0.02em; font-weight: 700 / 800;
  3. Quy tắc phân cấp chữ (Typographic Scale):
      • Micro-Label: text-[9px] hoặc text-[10px], uppercase, tracking-widest, text-zinc-500. Dùng cho nhãn metadata (Vd: STATUS:, BLOCK LAG:,
      RUNTIME:).
      • Controls & Tabs: text-xs font-mono font-bold uppercase tracking-wider.
      • Hero Metric Display: text-2xl đến text-4xl, font-extrabold font-mono tabular-nums text-white.

  ──────
  ## 4. Ngôn Ngữ Khối & Hình Học Góc Cạnh (Angular Geometry)

  ### 4.1. Quy tắc dập tắt bo tròn (Zero-Radius Rule)

    /* Triệt tiêu hoàn toàn góc bo */
    * {
      border-radius: 0px !important;
    }

  ### 4.2. Ngàm Góc Công Nghệ (Tech Corner Accents / L-Brackets)

  Thay vì bo góc mềm, DotNexus gắn 2 ngàm viền 2px sắc cạnh ở góc trên-trái và dưới-phải:

    .tech-corner-accent {
      position: relative;
    }
    .tech-corner-accent::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 6px;
      height: 6px;
      border-top: 2px solid #8B5CF6;
      border-left: 2px solid #8B5CF6;
      pointer-events: none;
    }
    .tech-corner-accent::after {
      content: '';
      position: absolute;
      bottom: 0;
      right: 0;
      width: 6px;
      height: 6px;
      border-bottom: 2px solid #8B5CF6;
      border-right: 2px solid #8B5CF6;
      pointer-events: none;
    }

  ### 4.3. Đèn chỉ báo vuông (Square Status Pips)

  Thay thế chấm tròn nhấp nháy truyền thống bằng ô vuông sắc cạnh 6x6 pixel với glow neon:

    .status-pip {
      width: 6px;
      height: 6px;
      border-radius: 0px;
      display: inline-block;
    }
    .status-pip-emerald {
      background-color: #00FF9D;
      box-shadow: 0 0 6px rgba(0, 255, 157, 0.8);
    }
    .status-pip-amber {
      background-color: #F59E0B;
      box-shadow: 0 0 6px rgba(245, 158, 11, 0.8);
    }
    .status-pip-rose {
      background-color: #EF4444;
      box-shadow: 0 0 6px rgba(239, 68, 68, 0.8);
    }
  ──────
  ## 5. Kết Cấu Nền & Khí Quyển (Atmospheric Textures)

  Để giao diện tối không bị đơn điệu hoặc ngột ngạt, phong cách này sử dụng tổ hợp 4 lớp hiệu ứng nền tinh tế:

    [ Lớp 4: Scanlines Overlay ]   -> Sọc ngang mờ 4px cách đều mô phỏng màn hình CRT
    [ Lớp 3: Cyber Dots ]         -> Ma trận điểm chấm tím mờ (radial 20px x 20px)
    [ Lớp 2: Cyber Grid ]         -> Lưới tọa độ quân sự 32px x 32px (alpha 4%)
    [ Lớp 1: Ambient Glow Orbs ]  -> 3 quả cầu phát sáng khổng lồ mờ (blur 120px)
    [ Lớp 0: #06040A ]            -> Nền Obsidian sâu thẳm

    /* 1. Lưới Cyber Grid 32px */
    .cyber-grid {
      background-size: 32px 32px;
      background-image:
        linear-gradient(to right, rgba(139, 92, 246, 0.04) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(139, 92, 246, 0.04) 1px, transparent 1px);
    }

    /* 2. Ma trận chấm Cyber Dots */
    .cyber-dots {
      background-image: radial-gradient(rgba(168, 85, 247, 0.16) 1px, transparent 1px);
      background-size: 20px 20px;
    }

    /* 3. Lớp mành quét Scanline (pointer-events: none) */
    .scanline-overlay {
      background: linear-gradient(
        rgba(14, 10, 30, 0) 50%,
        rgba(0, 0, 0, 0.28) 50%
      );
      background-size: 100% 4px;
    }

    /* 4. Quả cầu quang thông neon ẩn (Radial Ambient Orbs) */
    .glow-orb-violet {
      position: absolute;
      width: 500px;
      height: 500px;
      filter: blur(120px);
      pointer-events: none;
      background: radial-gradient(circle, rgba(139, 92, 246, 0.20) 0%, transparent 70%);
    }
  ──────
  ## 6. Thư Viện Thành Phần UI Mẫu (Tailwind & React Snippets)

  ### 6.1. Button Controls (Nút bấm sắc cạnh)

    // 1. Primary Call-to-Action (Tím Neon Điện Quang)
    <button className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-none border border-[#8B5CF6] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-md shadow-[#8B5CF6]/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]">
      <Zap className="w-3.5 h-3.5" />
      <span>EXECUTE OPERATION</span>
    </button>

    // 2. Secondary Ghost / Tactical Button (Đen Obsidian Viền Tím Sắc Cạnh)
    <button className="flex items-center justify-center gap-2 px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider rounded-none bg-[#110C1E] hover:bg-[#1A102E] text-zinc-300 hover:text-white border border-[#2E1F4A] hover:border-[#8B5CF6] transition-colors cursor-pointer">
      <Terminal className="w-3.5 h-3.5 text-[#C084FC]" />
      <span>SYSTEM DIAGNOSTIC</span>
    </button>

    // 3. Danger / Critical Action Button (Đỏ Rượu Huyết Dụ Cảnh Báo)
    <button className="flex items-center justify-center gap-2 px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider rounded-none bg-[#16080E] hover:bg-rose-950/70 text-rose-300 hover:text-rose-100 border border-rose-800/60 hover:border-rose-600 transition-colors cursor-pointer">
      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
      <span>TRIGGER FAILOVER</span>
    </button>

  ### 6.2. Card Khối Đo Lường (Telemetry Metric Block với L-Brackets)

    <div className="tech-corner-accent p-4 bg-[#0B0813] border border-[#1C142E] hover:border-[#2E1F4A] transition-colors font-mono">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1C142E] text-[10px]">
        <div className="flex items-center gap-2">
          <span className="status-pip status-pip-emerald" />
          <span className="text-zinc-400 font-bold tracking-widest uppercase">NODE CORE LATENCY</span>
        </div>
        <span className="text-emerald-400 font-bold px-1.5 py-0.5 border border-emerald-900/60 bg-emerald-950/30">
          NOMINAL
        </span>
      </div>

      {/* Metric Hero Value */}
      <div className="my-3">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">REALTIME P99</div>
        <div className="text-3xl font-extrabold text-white tracking-tight mt-0.5 tabular-nums flex items-baseline gap-1.5">
          <span>14.82</span>
          <span className="text-xs text-zinc-500 font-normal">ms</span>
        </div>
      </div>

      {/* Sub-strip Footer */}
      <div className="pt-2 border-t border-[#1C142E] flex justify-between text-[10px] text-zinc-500">
        <span>DELTA LAG: <strong className="text-zinc-200 tabular-nums">0 BLK</strong></span>
        <span>PEERS: <strong className="text-[#C084FC] tabular-nums">48 CONNECTED</strong></span>
      </div>
    </div>

  ### 6.3. Tab & Thanh Điều Hướng (Navigation Rails)

    <div className="flex items-center gap-1 border-b border-[#1C142E] bg-[#06040A] p-1 font-mono text-xs">
      {/* Tab Đang Chọn */}
      <button className="flex items-center gap-2 px-3.5 py-2 bg-[#110C1E] border-b-2 border-[#8B5CF6] text-white font-bold cursor-pointer">
        <Activity className="w-3.5 h-3.5 text-[#8B5CF6]" />
        <span>TELEMETRY STREAM</span>
      </button>

      {/* Tab Nghỉ */}
      <button className="flex items-center gap-2 px-3.5 py-2 text-zinc-400 hover:text-zinc-200 hover:bg-[#0B0813] border-b-2 border-transparent transition-colors cursor-pointer">
        <Shield className="w-3.5 h-3.5 text-zinc-500" />
        <span>SECURITY POLICIES</span>
      </button>
    </div>

  ### 6.4. Custom Scrollbar sắc cạnh

    /* Thanh cuộn vuông không bo tròn */
    ::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }
    ::-webkit-scrollbar-track {
      background: #080512;
    }
    ::-webkit-scrollbar-thumb {
      background: #261B42;
      border-radius: 0px !important;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #4C2889;
    }
  ──────
  ## 7. Checklist Kiểm Định Chất Lượng UI (Craft Floor Audit)

  Khi xây dựng sản phẩm mới theo phong cách này, đối chiếu checklist sau:

  [ ] Không có bất kỳ góc bo nào: Kiểm tra CSS không xuất hiện rounded-md, rounded-full (ngoại trừ ambient blur orbs).
  [ ] Viền 1px tinh gọn (Hairline): Không dùng viền dày thô; sử dụng mã #1C142E hoặc border-white/[0.08].
  [ ] Số liệu luôn Tabular: Áp dụng tabular-nums trên mọi con số để đảm bảo không bị giật bố cục khi cập nhật dữ liệu.
  [ ] Độ tương phản văn bản: Văn bản chính luôn ở mức #E2E8F0 hoặc #FFFFFF, văn bản phụ #9CA3AF, nhãn metadata #71717A.
  [ ] Đèn trạng thái hình vuông: Các pips báo hiệu trạng thái mạng/hệ thống phải là hình vuông kích thước 6x6px hoặc 8x8px kèm box-shadow tương
  ứng.