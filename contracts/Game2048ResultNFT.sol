// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract Game2048ResultNFT is ERC721URIStorage {
    using Strings for uint256;

    error DuplicateGameId(string gameId);
    error InvalidScore();
    error InvalidPlayer();
    error InvalidGameId();

    uint256 private _nextTokenId;
    mapping(bytes32 => bool) private _mintedGameIds;

    event ResultMinted(
        address indexed player,
        uint256 indexed tokenId,
        string gameId,
        uint256 score,
        uint256 playedAt
    );

    constructor() ERC721("2048 Game Result", "G2048") {}

    function mintResult(
        address player,
        uint256 score,
        uint256 durationSeconds,
        string calldata gameId,
        uint256 playedAt
    ) external returns (uint256 tokenId) {
        if (player == address(0)) revert InvalidPlayer();
        if (score == 0) revert InvalidScore();
        if (bytes(gameId).length == 0) revert InvalidGameId();

        bytes32 gameHash = keccak256(bytes(gameId));
        if (_mintedGameIds[gameHash]) revert DuplicateGameId(gameId);

        tokenId = ++_nextTokenId;
        _mintedGameIds[gameHash] = true;

        _safeMint(player, tokenId);
        _setTokenURI(tokenId, _buildTokenURI(player, score, durationSeconds, gameId, playedAt));

        emit ResultMinted(player, tokenId, gameId, score, playedAt);
    }

    function isGameIdMinted(string calldata gameId) external view returns (bool) {
        return _mintedGameIds[keccak256(bytes(gameId))];
    }

    function _buildTokenURI(
        address player,
        uint256 score,
        uint256 durationSeconds,
        string calldata gameId,
        uint256 playedAt
    ) private pure returns (string memory) {
        string memory image = _buildImageURI(player, score, durationSeconds, playedAt);

        string memory json = string.concat(
            _buildMetadataHeader(player, score, durationSeconds, gameId, playedAt, image),
            _buildMetadataAttributes(score, durationSeconds, gameId, playedAt),
            "]}"
        );

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    function _buildMetadataHeader(
        address player,
        uint256 score,
        uint256 durationSeconds,
        string calldata gameId,
        uint256 playedAt,
        string memory image
    ) private pure returns (string memory) {
        return string.concat(
            "{",
            '"name":"2048 Result #',
            score.toString(),
            '",',
            '"description":"On-chain 2048 game result.",',
            '"image":"',
            image,
            '",',
            '"playerAddress":"',
            Strings.toHexString(player),
            '",',
            '"score":',
            score.toString(),
            ",",
            '"durationSeconds":',
            durationSeconds.toString(),
            ",",
            '"gameId":"',
            gameId,
            '",',
            '"playedAt":',
            playedAt.toString(),
            ',"attributes":['
        );
    }

    function _buildMetadataAttributes(
        uint256 score,
        uint256 durationSeconds,
        string calldata gameId,
        uint256 playedAt
    ) private pure returns (string memory) {
        return string.concat(
            '{"trait_type":"Score","value":',
            score.toString(),
            "},",
            '{"trait_type":"Duration","value":',
            durationSeconds.toString(),
            "},",
            '{"trait_type":"GameId","value":"',
            gameId,
            '"},',
            '{"trait_type":"PlayedAt","value":',
            playedAt.toString(),
            "}"
        );
    }

    function _buildImageURI(
        address player,
        uint256 score,
        uint256 durationSeconds,
        uint256 playedAt
    ) private pure returns (string memory) {
        string memory svg = string.concat(
            _buildImageShellStart(),
            _buildImageScoreBlock(score),
            _buildImageDetailsBlock(player, durationSeconds, playedAt)
        );

        return string.concat("data:image/svg+xml;base64,", Base64.encode(bytes(svg)));
    }

    function _buildImageShellStart() private pure returns (string memory) {
        return string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600" preserveAspectRatio="xMidYMid meet" role="img" aria-label="2048 game result NFT">',
            _buildImageDefsAndFrame(),
            _buildImageBackdropTiles(),
            _buildImageTitleBlock()
        );
    }

    function _buildImageDefsAndFrame() private pure returns (string memory) {
        return string.concat(
            '<defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1f2937"/><stop offset="55%" stop-color="#0f172a"/><stop offset="100%" stop-color="#065f46"/></linearGradient><linearGradient id="scorePanel" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f59e0b" stop-opacity="0.28"/><stop offset="100%" stop-color="#f97316" stop-opacity="0.08"/></linearGradient></defs>',
            '<rect width="600" height="600" rx="36" fill="url(#bg)"/>',
            '<rect x="24" y="24" width="552" height="552" rx="28" fill="#111827" fill-opacity="0.18" stroke="#67e8f9" stroke-opacity="0.28" stroke-width="2"/>'
        );
    }

    function _buildImageBackdropTiles() private pure returns (string memory) {
        return string.concat(
            '<rect x="58" y="156" width="108" height="108" rx="20" fill="#f59e0b" fill-opacity="0.18"/>',
            '<rect x="184" y="156" width="108" height="108" rx="20" fill="#fb7185" fill-opacity="0.12"/>',
            '<rect x="310" y="156" width="108" height="108" rx="20" fill="#22c55e" fill-opacity="0.14"/>',
            '<rect x="436" y="156" width="108" height="108" rx="20" fill="#38bdf8" fill-opacity="0.14"/>',
            '<rect x="58" y="282" width="108" height="108" rx="20" fill="#f97316" fill-opacity="0.12"/>',
            '<rect x="184" y="282" width="108" height="108" rx="20" fill="#facc15" fill-opacity="0.18"/>',
            '<rect x="310" y="282" width="108" height="108" rx="20" fill="#2dd4bf" fill-opacity="0.14"/>',
            '<rect x="436" y="282" width="108" height="108" rx="20" fill="#a78bfa" fill-opacity="0.12"/>'
        );
    }

    function _buildImageTitleBlock() private pure returns (string memory) {
        return string.concat(
            '<text x="48" y="84" fill="#67e8f9" font-family="monospace" font-size="26" font-weight="700">2048 RESULT</text>',
            '<text x="48" y="124" fill="#e2e8f0" font-family="monospace" font-size="18">Arcade run minted on-chain</text>',
            '<text x="462" y="84" text-anchor="end" fill="#f8fafc" font-family="monospace" font-size="22">CHAIN NFT</text>',
            '<text x="462" y="116" text-anchor="end" fill="#cbd5e1" font-family="monospace" font-size="16">ARCADE PROOF</text>'
        );
    }

    function _buildImageScoreBlock(uint256 score) private pure returns (string memory) {
        return string.concat(
            '<rect x="84" y="176" width="432" height="176" rx="28" fill="#0f172a" fill-opacity="0.88" stroke="#f8fafc" stroke-opacity="0.12" stroke-width="2"/>',
            '<rect x="96" y="188" width="408" height="152" rx="22" fill="url(#scorePanel)"/>',
            '<text x="300" y="242" text-anchor="middle" fill="#f8fafc" font-family="monospace" font-size="38">HIGH SCORE</text>',
            '<text x="300" y="324" text-anchor="middle" fill="#facc15" font-family="monospace" font-size="90" font-weight="700">',
            score.toString(),
            "</text>"
        );
    }

    function _buildImageDetailsBlock(
        address player,
        uint256 durationSeconds,
        uint256 playedAt
    ) private pure returns (string memory) {
        return string.concat(
            '<rect x="48" y="396" width="504" height="148" rx="22" fill="#0f172a" fill-opacity="0.82" stroke="#334155"/>',
            '<text x="72" y="430" fill="#67e8f9" font-family="monospace" font-size="18">SESSION DATA</text>',
            '<text x="72" y="466" fill="#cbd5e1" font-family="monospace" font-size="20">DURATION  ',
            durationSeconds.toString(),
            's</text>',
            '<text x="72" y="504" fill="#cbd5e1" font-family="monospace" font-size="20">PLAYER  ',
            _shortAddress(player),
            "</text>",
            '<text x="72" y="542" fill="#cbd5e1" font-family="monospace" font-size="20">PLAYED AT  ',
            playedAt.toString(),
            "</text></svg>"
        );
    }

    function _shortAddress(address player) private pure returns (string memory) {
        bytes memory full = bytes(Strings.toHexString(player));
        bytes memory shortened = new bytes(13);

        shortened[0] = full[0];
        shortened[1] = full[1];
        shortened[2] = full[2];
        shortened[3] = full[3];
        shortened[4] = full[4];
        shortened[5] = full[5];
        shortened[6] = bytes1(".");
        shortened[7] = bytes1(".");
        shortened[8] = bytes1(".");
        shortened[9] = full[38];
        shortened[10] = full[39];
        shortened[11] = full[40];
        shortened[12] = full[41];

        return string(shortened);
    }
}
