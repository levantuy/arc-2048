
# 2048

2048 là một game giải đố trượt ô được xây dựng bằng React. Dự án này có giao diện gọn, tối ưu cho desktop và mobile, đồng thời hỗ trợ kết nối ví và mint kết quả game thành NFT trên Arc Testnet.

## Tính năng

- Gameplay 2048 cơ bản với điều khiển bằng phím mũi tên và thao tác vuốt trên mobile
- Giao diện responsive, phù hợp cho nhiều kích thước màn hình
- Lưu điểm số và best score
- Bảng xếp hạng
- Kết nối ví và mint kết quả game thành ERC-721 NFT
- Bảo vệ mint trùng cho cùng một `gameId`

## Demo

- Live site: https://2048.learnjournal.site
- GitHub: https://github.com/levantuy/arc-2048

## Cài đặt

```bash
npm install
cp .env.example .env
```

Sau đó cấu hình các biến môi trường cần thiết trong `.env`, đặc biệt là các giá trị cho Arc RPC, địa chỉ contract và private key nếu bạn cần deploy contract.

## Chạy dự án

```bash
npm run dev
```

Mở ứng dụng tại `http://localhost:5173`.

## Các lệnh hữu ích

```bash
npm run build
npm run lint
npm run test:contract
npm run test:ui
npm run test:all
npm run contract:compile
npm run contract:deploy:arcTestnet
```

## Cấu hình NFT

Contract và frontend được thiết kế để mint NFT kết quả khi game kết thúc. Dự án hiện dùng Arc Testnet.

- Chain ID: `5042002`
- RPC: `https://rpc.testnet.arc.network`
- Explorer: `https://testnet.arcscan.app`

Các biến môi trường thường dùng:

- `VITE_ARC_RPC_URL`
- `VITE_ARC_EXPLORER_URL`
- `VITE_2048_NFT_CONTRACT_ADDRESS`
- `ARC_RPC_URL`
- `DEPLOYER_PRIVATE_KEY`

## Cách chơi

- Dùng phím mũi tên để di chuyển các ô trên bàn cờ.
- Trên điện thoại, vuốt theo hướng bạn muốn di chuyển.
- Hai ô cùng giá trị sẽ gộp lại khi chạm nhau.
- Mục tiêu là tạo ra ô 2048, nhưng bạn có thể tiếp tục để đạt điểm cao hơn.

## Thông tin liên hệ

- Tên: TuyLv
- Email: levantuy.it@gmail.com
- GitHub: https://github.com/levantuy/arc-2048
- Website: [https://2048.io.vn](https://www.2048.io.vn)

## License

Chưa khai báo license.
