# Disaster Management System Frontend

Dự án frontend cho hệ thống Cứu hộ Cứu nạn (CHCN) quốc gia, được xây dựng bằng Next.js 15.

## Cài đặt

Đầu tiên, cài đặt các dependencies:

```bash
npm install
```

## Phát triển
```bash
npm run dev
```
Mở http://localhost:3000 trên trình duyệt để xem kết quả.

## Cấu trúc thư mục

```
src/
├── app/               # Routes và layout
│   ├── (main)/        # Trang chính sau khi đăng nhập
│   ├── (manage)/      # Trang quản lý thiết bị, tài khoản
│   └── auth/          # Trang đăng nhập/đăng ký
├── components/        # Các components có thể tái sử dụng
│   ├── ui/            # UI components (buttons, inputs, etc.)
│   ├── common/        # Common components cho các trang
│   ├── panel/         # Layout components (Header, Footer, Sidebar)
│   ├── wrapper/       # Higher-order components (MediaUploader, DatePicker)
│   └── providers/     # Context providers  
├── lib/               # Utilities và configurations
│   ├── redux/         # Redux store setup
│   ├── api/           # API configuration
│   └── utils/         # Helper functions
├── utils/             # Utility functions
└── generated/         # Auto-generated API hooks và types
    ├── api/           # OpenAPI generated code
    └── hooks/         # ZenStack hooks
```

## Tech Stack

| Công nghệ | Mô tả |
|-----------|--------|
| Next.js 15 | Framework React với server-side rendering |
| Tailwind CSS | Styling framework |
| Tanstack Query | Data fetching và state management |
| React Hook Form + Zod | Form handling và validation |
| Redux/Easy-peasy | State Management |
| Prisma | Type-safe database client |
| ZenStack | API hooks generation |
| Lucide React | Icon library |
| Radix UI | Accessible component primitives |
| date-fns | Date utility library |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Chạy development server |
| `npm run build` | Build production |
| `npm run start` | Chạy production server |
| `npm run lint` | Kiểm tra lỗi với ESLint |
| `npm run generate` | Generate API hooks từ OpenAPI schema |

## Tính năng chính

- **Xác thực & Phân quyền**
  - Đăng nhập/Đăng ký
  - Quản lý thiết bị đăng nhập
  - Phân quyền người dùng

- **Quản lý Thảm họa**
  - Theo dõi và quản lý thông tin thảm họa
  - Phân loại mức độ khẩn cấp và ưu tiên
  - Bản đồ định vị thảm họa
  - Quản lý media liên quan (ảnh, tài liệu)

- **Quản lý Nguồn lực Cứu hộ**
  - Theo dõi các nguồn lực cứu hộ
  - Phân bổ nguồn lực cho các thảm họa
  - Báo cáo và thống kê

- **Quản lý Dữ liệu**
  - Quản lý đơn vị hành chính (tỉnh, huyện, xã)
  - Quản lý các loại thảm họa
  - Quản lý mức độ khẩn cấp và ưu tiên
  - Quản lý trường dữ liệu

## Architecture

Hệ thống sử dụng kiến trúc client-server với:
- Frontend: Next.js (application này)
- Backend: NestJS REST API + Prisma ORM
- Database: PostgreSQL
- File storage: MinIO

## Contributing

1. Clone project
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Add local repo (`git add .`)
4. Commit changes theo format:
   ```bash
   git commit -m "[type]: message"
   ```
   Trong đó:
   - `type`: Loại thay đổi
     - `create`: Tạo mới tính năng/file
     - `add`: Thêm code/tính năng vào file có sẵn
     - `update`: Cập nhật tính năng
     - `fix`: Sửa lỗi
     - `refactor`: Tối ưu code
     - `remove`: Xóa code/tính năng
   - `message`: Mô tả ngắn gọn về thay đổi (tiếng Anh hoặc Việt)

   Ví dụ:
   ```bash
   git commit -m "[create]: Thêm trang chi tiết thảm họa"
   git commit -m "[fix]: Sửa lỗi validate form"
   git commit -m "[update]: Cải thiện hiệu suất bản đồ"
   ```
5. Push to branch (`git push origin feature/AmazingFeature`)

> ⚠️ **Cảnh báo:** Luôn luôn `git pull` trước khi code và xử lý cẩn thận các conflict

## Liên hệ

Nếu có câu hỏi hoặc góp ý, vui lòng liên hệ nhóm phát triển.
