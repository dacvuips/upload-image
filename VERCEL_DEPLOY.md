# Hướng dẫn Deploy lên Vercel

## Bước 1: Chuẩn bị

1. Đảm bảo bạn đã cài đặt Vercel CLI:
```bash
npm i -g vercel
```

2. Build project:
```bash
npm run build
```

## Bước 2: Cấu hình Environment Variables

Trong Vercel Dashboard, thêm các environment variables sau:

### Database
- `NODE_ENV`: `production`
- `MONGO_URI`: Connection string MongoDB của bạn

### Redis (nếu sử dụng)
- `REDIS_HOST`: Host Redis
- `REDIS_PASSWORD`: Password Redis

### Firebase (nếu sử dụng)
- `FIREBASE_PROJECT_ID`: Project ID Firebase
- `FIREBASE_PRIVATE_KEY`: Private key Firebase
- `FIREBASE_CLIENT_EMAIL`: Client email Firebase

### Các biến khác
- `SECRET_KEY`: Secret key cho ứng dụng
- `DOMAIN`: Domain của ứng dụng (sẽ được Vercel tự động set)

## Bước 3: Deploy

### Cách 1: Sử dụng Vercel CLI
```bash
vercel
```

### Cách 2: Deploy qua GitHub
1. Push code lên GitHub
2. Kết nối repository với Vercel
3. Vercel sẽ tự động build và deploy

## Bước 4: Cấu hình Custom Domain (tùy chọn)

Trong Vercel Dashboard:
1. Vào project settings
2. Thêm custom domain
3. Cập nhật DNS records

## Lưu ý quan trọng

1. **Database**: Đảm bảo MongoDB có thể truy cập từ internet hoặc sử dụng MongoDB Atlas
2. **Redis**: Nếu sử dụng Redis, đảm bảo có thể truy cập từ internet
3. **File Upload**: Vercel có giới hạn về file size, nên sử dụng external storage như AWS S3, Firebase Storage
4. **Environment Variables**: Không commit file `.env` lên git, chỉ sử dụng Vercel environment variables

## Troubleshooting

### Lỗi build
- Kiểm tra TypeScript compilation: `npm run build-ts`
- Kiểm tra dependencies trong `package.json`

### Lỗi runtime
- Kiểm tra logs trong Vercel Dashboard
- Đảm bảo tất cả environment variables đã được set
- Kiểm tra kết nối database và Redis

### Lỗi CORS
- Cấu hình CORS trong `src/express.ts` để cho phép domain Vercel 