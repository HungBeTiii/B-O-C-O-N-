# Bản ổn định - Topping + Đánh giá khách hàng

## Điểm khác của bản này
- Không còn bắt buộc chạy Frontend và Backend bằng hai terminal khi demo.
- `npm run dev` build Frontend và Express phục vụ toàn bộ website trên `http://127.0.0.1:3001`.
- Có `START_PROJECT.bat` để chạy một lần bằng nhấp đúp.
- MongoDB là nguồn dữ liệu chính khi kết nối được; nếu MongoDB lỗi, hệ thống tự fallback về JSON demo.

## Test nhanh sau khi chạy
1. Trang chủ -> chọn một món -> chọn topping -> thêm vào giỏ.
2. Giỏ -> kiểm tra topping và tổng tiền.
3. Checkout -> chọn vị trí -> tạo đơn.
4. Admin -> đơn hàng -> chuyển sang `Hoàn thành`.
5. Khách -> Theo dõi đơn -> `Đánh giá đơn hàng`.
6. Nhập mã đơn + đúng số điện thoại -> gửi 1-5 sao.
7. Admin -> Đánh giá để kiểm tra kết quả.

## Nếu cổng 3001 bị chiếm
Chạy `STOP_PROJECT.bat`, sau đó chạy lại `START_PROJECT.bat`.
