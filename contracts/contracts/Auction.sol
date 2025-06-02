// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NFTAuction is ReentrancyGuard, IERC721Receiver {
    struct Auction {
        address seller;
        address highestBidder;
        uint256 highestBid;
        uint256 startTime;
        uint256 endTime;
        uint256 buyNowPrice;
        uint256 minBidIncrement;
        bool ended;
    }

    mapping(uint256 => Auction) public auctions;
    IERC721 public immutable nftContract;

    event AuctionCreated(uint256 indexed tokenId, address seller, uint256 start, uint256 end, uint256 buyNow);
    event BidPlaced(uint256 indexed tokenId, address bidder, uint256 amount);
    event AuctionEnded(uint256 indexed tokenId, address winner, uint256 price);
    event AuctionCanceled(uint256 indexed tokenId);

    constructor(address _nft) {
        nftContract = IERC721(_nft);
    }

    function createAuction(
        uint256 tokenId,
        uint256 duration,
        uint256 buy,
        uint256 minInc
    ) external {
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not owner");
        require(auctions[tokenId].seller == address(0), "Auction exists");

        nftContract.safeTransferFrom(msg.sender, address(this), tokenId);

        auctions[tokenId] = Auction({
            seller: msg.sender,
            highestBidder: address(0),
            highestBid: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            buyNowPrice: buy,
            minBidIncrement: minInc,
            ended: false
        });

        emit AuctionCreated(tokenId, msg.sender, block.timestamp, block.timestamp + duration, buy);
    }

    function placeBid(uint256 tokenId) external payable nonReentrant {
        Auction storage a = auctions[tokenId];
        require(!a.ended, "Auction ended");
        require(block.timestamp < a.endTime, "Auction time expired");
        require(msg.value >= a.highestBid + a.minBidIncrement, "Bid too low");

        // Автоматичне завершення якщо хтось перебиває buyNowPrice
        if (msg.value >= a.buyNowPrice) {
            _endAuction(tokenId, msg.sender, msg.value);
            return;
        }

        if (a.highestBidder != address(0)) {
            payable(a.highestBidder).transfer(a.highestBid);
        }

        a.highestBidder = msg.sender;
        a.highestBid = msg.value;

        emit BidPlaced(tokenId, msg.sender, msg.value);
    }

    function buyNow(uint256 tokenId) external payable nonReentrant {
        Auction storage a = auctions[tokenId];
        require(!a.ended, "Auction ended");
        require(block.timestamp < a.endTime, "Auction time expired");
        require(msg.value >= a.buyNowPrice, "Insufficient funds");

        _endAuction(tokenId, msg.sender, msg.value);
    }

    function endAuction(uint256 tokenId) external nonReentrant {
        Auction storage a = auctions[tokenId];
        require(!a.ended, "Already ended");
        require(block.timestamp >= a.endTime || msg.sender == a.seller, "Not ended or not seller");

        _endAuction(tokenId, a.highestBidder, a.highestBid);
    }

    function _endAuction(uint256 tokenId, address winner, uint256 price) private {
        Auction storage a = auctions[tokenId];
        a.ended = true;

        if (winner != address(0)) {
            payable(a.seller).transfer(price);
            nftContract.safeTransferFrom(address(this), winner, tokenId);
        } else {
            nftContract.safeTransferFrom(address(this), a.seller, tokenId);
        }

        emit AuctionEnded(tokenId, winner, price);
        delete auctions[tokenId];
    }

    function cancelAuction(uint256 tokenId) external nonReentrant {
        Auction storage a = auctions[tokenId];
        require(a.seller == msg.sender, "Not seller");
        require(a.highestBid == 0, "Has bids");
        require(!a.ended, "Already ended");

        nftContract.safeTransferFrom(address(this), a.seller, tokenId);
        delete auctions[tokenId];

        emit AuctionCanceled(tokenId);
    }

    // Дозволяє будь-кому викликати завершення аукціону після його закінчення
    function checkAndEndExpiredAuction(uint256 tokenId) external nonReentrant {
        Auction storage a = auctions[tokenId];
        require(!a.ended, "Already ended");
        require(block.timestamp >= a.endTime, "Auction not expired");

        _endAuction(tokenId, a.highestBidder, a.highestBid);
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}