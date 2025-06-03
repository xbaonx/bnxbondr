# Bondr Backend API

Backend API cho ứng dụng di động Bondr, cung cấp các endpoint cần thiết cho việc xác thực người dùng, quản lý hồ sơ, kết bạn và chia sẻ khoảnh khắc.

## Công nghệ sử dụng

- Node.js
- Express.js
- Firebase Admin SDK (Authentication, Firestore, Storage)

## Cài đặt

1. Clone repository

```bash
git clone <repository-url>
cd bondr-backend
```

2. Cài đặt dependencies

```bash
npm install
```

3. Thiết lập biến môi trường

Tạo file `.env` theo mẫu từ `.env.example` và cập nhật các thông tin Firebase của bạn.

## Triển khai lên Render

1. Đăng ký tài khoản [Render](https://render.com/)
2. Tạo Web Service mới, liên kết với repository GitHub của bạn
3. Thiết lập các biến môi trường trong phần "Environment" của Render
4. Deploy và xác nhận hoạt động

## API Endpoints

### User API

- **POST /validateEmailAddress**: Kiểm tra xem email đã tồn tại chưa
- **POST /sendVerificationCode**: Gửi mã xác minh qua SMS
- **POST /sendPasswordResetEmail**: Gửi email đặt lại mật khẩu
- **POST /validateUsername**: Kiểm tra xem tên người dùng đã tồn tại chưa (cần xác thực)
- **POST /changeProfileInfo**: Cập nhật thông tin hồ sơ người dùng (cần xác thực)

### Friend API

- **POST /fetchUserV2**: Lấy thông tin người dùng (cần xác thực)
- **POST /sendFriendRequest**: Gửi lời mời kết bạn (cần xác thực)
- **POST /getFriends**: Lấy danh sách bạn bè (cần xác thực)

### Moment API

- **POST /getLatestMomentV2**: Lấy khoảnh khắc mới nhất từ bạn bè (cần xác thực)
- **POST /createMoment**: Tạo khoảnh khắc mới (cần xác thực)

## Phát triển

Để chạy server trong môi trường phát triển:

```bash
npm run dev
```

Server sẽ chạy tại http://localhost:3000 (hoặc port được chỉ định trong biến môi trường).

## License

ISC
