# mi_chotxoo – Website quản lý và đặt món trực tuyến

Bản demo full-stack dùng cho báo cáo đồ án:
- Frontend: React 18 + TypeScript + TailwindCSS + Vite
- Backend: Node.js + Express
- CSDL chính: MongoDB (nếu có `MONGO_URI`)
- Chế độ dự phòng: file JSON cục bộ `data/demo-db.json` để demo không cần mở MongoDB
- Bản đồ: React-Leaflet + OpenStreetMap; chỉ đường qua Google Maps
- Xác thực Admin: JWT

## 1. Chạy chương trình

Mở PowerShell/Terminal tại đúng thư mục có `package.json` rồi chạy:

```powershell
npm install
copy .env.example .env
npm run dev
```

Nếu PowerShell báo file `.env` đã tồn tại thì bỏ qua lệnh `copy`.

Mở:
- Trang khách: http://127.0.0.1:5174
- Admin: http://127.0.0.1:5174/admin/login
- API health: http://127.0.0.1:3001/api/health

Tài khoản Admin mặc định:
- Username: `admin`
- Password: `123456`

## 2. MongoDB có bắt buộc không?

Không. Nếu `.env` để `MONGO_URI=` trống, server tự chạy bằng file:

`data/demo-db.json`

Dữ liệu đơn hàng vẫn được lưu sau khi tắt/mở chương trình. Đây là chế độ an toàn để báo cáo.

Nếu muốn dùng MongoDB thật, sửa `.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/mi_chotxoo
```

sau đó mở MongoDB và chạy lại `npm run dev`.

## 3. Các chức năng đã có

### Khách hàng
- Xem thực đơn, tìm kiếm, lọc theo danh mục
- Thêm món vào giỏ, đổi số lượng, xóa món
- Đặt món không cần tài khoản
- Nhập họ tên, SĐT, địa chỉ, ghi chú
- Chọn vị trí trên bản đồ, lưu latitude/longitude
- Chọn tiền mặt/chuyển khoản
- Tạo mã đơn
- Theo dõi trạng thái đơn bằng mã đơn

### Admin
- Đăng nhập JWT
- Dashboard: tổng đơn, đơn đang xử lý, doanh thu, giá vốn, lợi nhuận, món bán chạy
- Quản lý danh mục: thêm/sửa/xóa
- Quản lý món ăn: thêm/sửa/xóa, giá bán, giá vốn, trạng thái còn/hết, ảnh URL
- Quản lý đơn hàng: tìm kiếm, lọc trạng thái
- Xem chi tiết đơn
- Cập nhật trạng thái: Chờ xác nhận → Đã xác nhận → Đang chuẩn bị → Đang giao hàng → Hoàn thành / Đã hủy
- Xem vị trí khách trên bản đồ
- Mở Google Maps để chỉ đường
- Order lưu snapshot `priceAtPurchase` và `costPriceAtPurchase`

## 4. Nếu thấy màn hình trắng

Bản v2 đã có Error Boundary nên lỗi giao diện sẽ hiện thông báo thay vì trắng màn hình. Nếu vẫn gặp lỗi, kiểm tra hai cửa sổ terminal `[API]` và `[WEB]`.

Hãy chắc chắn bạn đang chạy đúng bản mới trong một thư mục mới, không chạy nhầm project cũ.

Kiểm tra API:

http://127.0.0.1:3001/api/health

Phải trả JSON dạng:

```json
{"ok":true,"mode":"file","database":"Local JSON file"}
```

hoặc `mode: "mongo"` nếu đang dùng MongoDB.

## 5. Luồng demo đề xuất

1. Trang khách → thêm món → giỏ hàng → đặt hàng → chọn vị trí bản đồ → xác nhận.
2. Trang theo dõi → xem mã và trạng thái.
3. Admin → Đơn hàng → mở đơn vừa tạo → đổi trạng thái → xem bản đồ → bấm chỉ đường.
4. Chuyển trạng thái thành `Hoàn thành`.
5. Admin → Tổng quan → xem doanh thu, giá vốn, lợi nhuận cập nhật.


## Luồng vị trí giao hàng (bản v4)
- Khách không còn bị gán tọa độ mặc định vào đơn.
- Khách phải chọn một điểm trên bản đồ hoặc bấm **Dùng vị trí hiện tại**.
- Trình duyệt dùng Geolocation API với `enableHighAccuracy: true`.
- Marker trên bản đồ có thể kéo thả để chỉnh đúng cửa nhà/ngõ.
- `latitude` và `longitude` được lưu cùng Order.
- Admin mở chi tiết đơn sẽ thấy đúng marker của khách.
- Nút **Chỉ đường tới vị trí khách hàng** mở Google Maps với tọa độ đích đã lưu.
- Nếu lớp bản đồ không tải được, giao diện hiện cảnh báo thay vì trắng hoàn toàn.
