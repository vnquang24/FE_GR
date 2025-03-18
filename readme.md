# Pickelball Court Management Frontend

Dự án frontend cho hệ thống quản lý sân Pickelball, được xây dựng bằng Next.js 15.

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
├── components/        # Các components có thể tái sử dụng
│   ├── ui/           # UI components (buttons, inputs, etc.)
│   └── providers/    # Context providers  
├── lib/              # Utilities và configurations
│   └── redux/        # Redux store setup
└── utils/            # Helper functions
```

## Tech Stack

| Công nghệ | Mô tả |
|-----------|--------|
| Next.js 15 | Framework |
| Tailwind CSS | Styling |
| Redux/Easy-peasy | State Management |
| React Hook Form + Zod | Form Handling |
| React Big Calendar | Calendar |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Chạy development server |
| `npm run build` | Build production |
| `npm run start` | Chạy production server |
| `npm run lint` | Kiểm tra lỗi với ESLint |

## Tính năng

- Đăng nhập/Đăng ký
- Quản lý đặt sân
- Xem lịch sử đặt sân
- Quản lý profile người dùng
- Xem thống kê

## Contributing

1. Clone project (`git clone https://github.com/vnquang24/KTPM-FE-ADMIN-MANAGER.git`)
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
   git commit -m "[create]: Add login page"
   git commit -m "[fix]: Sửa lỗi validate form đăng ký"
   git commit -m "[update]: Thêm loading state cho button"
   ```
5. Push to branch (`git push origin feature/AmazingFeature`)

> ⚠️ **Cảnh báo:** Luôn luôn `git pull` trước khi code. Xử lý cẩn thận ```conflict```

> Khi cần ```merge``` vào ```main``` thì sẽ trao đổi
