
# 2048

2048 là một game giải đố trượt ô được xây dựng bằng React. Dự án này có giao diện gọn, tối ưu cho desktop và mobile, đồng thời hỗ trợ kết nối ví và mint kết quả game thành NFT trên Arc.

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
npm run contract:deploy:arcMainnet
```

## Cấu hình NFT

Contract và frontend được thiết kế để mint NFT kết quả khi game kết thúc. Mặc định hiện tại là Arc Mainnet.

- Chain ID (Mainnet): `5042`
- RPC primary: `https://rpc.mainnet.arc.io`
- RPC fallback (thứ tự ưu tiên):
	- `https://rpc.blockdaemon.mainnet.arc.io`
	- `https://rpc.drpc.mainnet.arc.io`
	- `https://rpc.quicknode.mainnet.arc.io`
	- `https://arc-mainnet.g.alchemy.com/v2/YOUR_API_KEY` (khi có API key)
- Explorer (Mainnet): `https://explorer.arc.io`

WebSocket cho Mainnet không dùng primary endpoint. Nếu cần realtime subscription, cấu hình endpoint của provider:

- `wss://rpc.blockdaemon.mainnet.arc.io/websocket`
- `wss://rpc.quicknode.mainnet.arc.io`
- `wss://arc-mainnet.g.alchemy.com/v2/YOUR_API_KEY` (khi có API key)

Các biến môi trường thường dùng:

- `VITE_ARC_RPC_URL`
- `VITE_ARC_RPC_FALLBACK_URLS`
- `VITE_ARC_RPC_WS_URLS`
- `VITE_ARC_EXPLORER_URL`
- `VITE_ARC_MAINNET_ALCHEMY_API_KEY`
- `VITE_2048_NFT_CONTRACT_ADDRESS`
- `ARC_MAINNET_RPC_URL`
- `ARC_MAINNET_RPC_FALLBACK_URLS`
- `ARC_MAINNET_WS_URLS`
- `ARC_MAINNET_ALCHEMY_API_KEY`
- `DEPLOYER_PRIVATE_KEY`

Deploy mainnet được bảo vệ bằng preflight chainId trong script `scripts/deployArcMainnet.js`.
Script sẽ fail sớm nếu:

- Chạy sai Hardhat network (không phải `arcMainnet`)
- `DEPLOYER_PRIVATE_KEY` thiếu hoặc là placeholder
- RPC trả về chainId khác `5042`

## Preflight bảo mật cho ARC Mainnet

Trước khi chạy tác vụ bảo mật, chạy preflight bắt buộc để kiểm chứng kết nối Arc Mainnet:

```bash
npm run security:preflight:arc
```

Script preflight sẽ:

- Gọi `eth_chainId` và `eth_blockNumber` để xác nhận endpoint hoạt động.
- Kiểm tra chain ID thực tế phải là `5042`; sai thì dừng ngay.
- Tự động fallback qua các RPC dự phòng theo thứ tự đã cấu hình.
- Báo rõ lỗi thiếu quyền truy cập trong giai đoạn private mainnet (permissioned endpoint).
- Không retry vô hạn, dùng retry có giới hạn và backoff có kiểm soát.

Nếu tác vụ cần realtime/subscription:

```bash
npm run security:preflight:arc:realtime
```

Script sẽ thử WS endpoint hợp lệ của provider. Nếu WS thất bại, script tự động chuyển sang polling HTTP với backoff.

Chạy audit kèm preflight:

```bash
npm run security:audit:arc
```

Đầu ra bổ sung bắt buộc được ghi trong `arc-network-preflight-report.json`, gồm:

- Bảng cấu hình mạng đã áp dụng: `networkName`, `chainId`, `rpcPrimary`, `rpcFallback`, `wsEndpoint`.
- Kết quả preflight: `chainIdActual`, `blockNumber`, `activeEndpoint`.
- Lỗi kết nối (nếu có) và cơ chế fallback đã kích hoạt.
- Thay đổi cấu hình trước/sau và lý do áp dụng.

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
