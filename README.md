# Website quản lý và đặt món ăn trực tuyến cho nhà hàng

## Cách chạy ổn định nhất trên Windows

### Cách 1 - Khuyên dùng
Nhấp đúp `START_PROJECT.bat`.

File này sẽ tự:
1. Tạo `.env` nếu chưa có.
2. Cài thư viện nếu chưa có `node_modules`.
3. Build Frontend.
4. Dừng tiến trình Node cũ đang giữ cổng 3001.
5. Khởi động Backend + Frontend trên **một cổng duy nhất**.
6. Mở trình duyệt tại `http://127.0.0.1:3001`.

Muốn dừng project, đóng cửa sổ server hoặc chạy `STOP_PROJECT.bat`.

### Cách 2 - Dùng Terminal
```bash
npm install
npm run dev
```

Sau khi chạy thành công, mở:
- Website: `http://127.0.0.1:3001`
- API health: `http://127.0.0.1:3001/api/health`

`npm run dev` trong bản này **build Frontend rồi để Express phục vụ luôn Frontend**, nên không cần chạy hai Terminal và không còn phụ thuộc cổng 5174 khi demo.

Nếu đang lập trình và muốn Vite hot reload, có thể dùng `npm run dev:hot`; chế độ này mới dùng cổng 5174.

## MongoDB
Mặc định `.env.example` dùng:

```env
MONGO_URI=mongodb://127.0.0.1:27017/restaurant_ordering
```

Nếu MongoDB đang chạy, Backend sử dụng MongoDB. Nếu không kết nối được MongoDB, hệ thống tự chuyển sang `data/demo-db.json` để vẫn có thể chạy demo.

Các collection:
- `categories`
- `products`
- `addons`
- `orders`
- `admins`
- `reviews`

## Chức năng khách hàng
- Xem, tìm kiếm và lọc món ăn.
- Chọn đồ thêm/topping trước khi thêm món vào giỏ.
- Giỏ hàng tự tính giá món + topping.
- Đặt món, chọn phương thức thanh toán.
- Chọn vị trí giao hàng bằng Geolocation hoặc click/kéo marker.
- Theo dõi đơn bằng mã đơn.
- Đánh giá 1-5 sao sau khi đơn hoàn thành, xác minh bằng mã đơn + số điện thoại.
- Xem các đánh giá gần nhất ở trang chủ.

## Chức năng Admin
- Đăng nhập JWT.
- Quản lý danh mục, món ăn.
- Quản lý đồ thêm: tên, giá bán, giá vốn, còn/hết.
- Quản lý đơn và trạng thái.
- Xem vị trí giao hàng, mở Google Maps chỉ đường.
- Xem/xóa đánh giá khách hàng.
- Dashboard doanh thu, giá vốn, lợi nhuận, món bán chạy, điểm đánh giá trung bình.

## Bản đồ
- React-Leaflet + Leaflet.
- Lớp bản đồ nền: Esri World Street Map.
- Geolocation API: lấy vị trí hiện tại.
- Google Maps: chỉ đường.

## Tài khoản Admin demo
- Username: `admin`
- Password: `123456`

## Lưu ý GitHub
Không commit:
- `.env`
- `node_modules/`
- `dist/`
