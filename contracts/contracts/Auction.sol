// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AuctionMulti is IERC721Receiver, ReentrancyGuard {
    struct Auction {
        address seller;
        address highestBidder;
        uint256 highestBid;       
        uint256 endTime;          
        uint256 buyNowPrice;      
        uint256 minBidIncrement;  
        bool    ended;
    }

    mapping(address => mapping(uint256 => Auction)) public auctions;

    event AuctionCreated(address indexed nft, uint256 indexed tokenId, address seller, uint256 endTime, uint256 buyNow);
    event BidPlaced     (address indexed nft, uint256 indexed tokenId, address bidder, uint256 amount);
    event AuctionEnded  (address indexed nft, uint256 indexed tokenId, address winner, uint256 price);
    event AuctionCanceled(address indexed nft, uint256 indexed tokenId);


    function createAuction(
        address _nft,
        uint256 _tokenId,
        uint256 _durationSec,
        uint256 _buyNowWei,
        uint256 _minIncWei
    ) external {
        IERC721 nft = IERC721(_nft);

        require(nft.ownerOf(_tokenId) == msg.sender, "Not owner");
        require(auctions[_nft][_tokenId].seller == address(0), "Auction exists");

        nft.safeTransferFrom(msg.sender, address(this), _tokenId);

        auctions[_nft][_tokenId] = Auction({
            seller: msg.sender,
            highestBidder: address(0),
            highestBid: 0,
            endTime: block.timestamp + _durationSec,
            buyNowPrice: _buyNowWei,
            minBidIncrement: _minIncWei,
            ended: false
        });

        emit AuctionCreated(_nft, _tokenId, msg.sender, block.timestamp + _durationSec, _buyNowWei);
    }

    function placeBid(address _nft, uint256 _tokenId) external payable nonReentrant {
        Auction storage a = auctions[_nft][_tokenId];
        require(!a.ended, "Ended");
        require(block.timestamp < a.endTime, "Expired");
        require(msg.value >= a.highestBid + a.minBidIncrement, "Bid too low");

        if (msg.value >= a.buyNowPrice && a.buyNowPrice != 0) {
            _endAuction(_nft, _tokenId, msg.sender, msg.value);
            return;
        }

        if (a.highestBidder != address(0)) {
            payable(a.highestBidder).transfer(a.highestBid);
        }
        a.highestBidder = msg.sender;
        a.highestBid = msg.value;

        emit BidPlaced(_nft, _tokenId, msg.sender, msg.value);
    }

    function buyNow(address _nft, uint256 _tokenId) external payable nonReentrant {
        Auction storage a = auctions[_nft][_tokenId];
        require(!a.ended, "Ended");
        require(block.timestamp < a.endTime, "Expired");
        require(msg.value >= a.buyNowPrice && a.buyNowPrice != 0, "Too low");

        _endAuction(_nft, _tokenId, msg.sender, msg.value);
    }

    function endAuction(address _nft, uint256 _tokenId) external nonReentrant {
        Auction storage a = auctions[_nft][_tokenId];
        require(!a.ended, "Ended");
        require(block.timestamp >= a.endTime || msg.sender == a.seller, "Too early");

        _endAuction(_nft, _tokenId, a.highestBidder, a.highestBid);
    }

    function cancelAuction(address _nft, uint256 _tokenId) external nonReentrant {
        Auction storage a = auctions[_nft][_tokenId];
        require(a.seller == msg.sender, "Not seller");
        require(!a.ended, "Ended");
        require(a.highestBid == 0, "Has bid");

        IERC721(_nft).safeTransferFrom(address(this), a.seller, _tokenId);
        delete auctions[_nft][_tokenId];

        emit AuctionCanceled(_nft, _tokenId);
    }

    function _endAuction(
        address _nft,
        uint256 _tokenId,
        address _winner,
        uint256 _price
    ) private {
        Auction storage a = auctions[_nft][_tokenId];
        a.ended = true;

        if (_winner != address(0)) {
            payable(a.seller).transfer(_price);
            IERC721(_nft).safeTransferFrom(address(this), _winner, _tokenId);
        } else {
            IERC721(_nft).safeTransferFrom(address(this), a.seller, _tokenId);
        }

        emit AuctionEnded(_nft, _tokenId, _winner, _price);
        delete auctions[_nft][_tokenId];
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
