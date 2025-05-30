// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Marketplace is ReentrancyGuard, Ownable {
    struct Listing {
        address seller;
        uint256 price;
        bool exists;
    }

    IERC721 public nftContract;
    mapping(uint256 => Listing) public listings;
    uint256[] public listedTokenIds;

    event ItemListed(uint256 indexed tokenId, address seller, uint256 price);
    event ItemCanceled(uint256 indexed tokenId, address seller);
    event ItemBought(uint256 indexed tokenId, address buyer, uint256 price);

    constructor(address _nftContract) Ownable(msg.sender) {
        nftContract = IERC721(_nftContract);
    }

    modifier isOwner(uint256 _tokenId, address spender) {
        require(nftContract.ownerOf(_tokenId) == spender, "Not owner");
        _;
    }

    modifier listingExists(uint256 _tokenId) {
        require(listings[_tokenId].exists, "Listing not found");
        _;
    }

    function listItem(uint256 _tokenId, uint256 _price) external isOwner(_tokenId, msg.sender) {
        require(_price > 0, "Price must be > 0");
        
        address approved = nftContract.getApproved(_tokenId);
        require(approved == address(this), "Marketplace not approved");
        
        listings[_tokenId] = Listing(msg.sender, _price, true);
        listedTokenIds.push(_tokenId);
        emit ItemListed(_tokenId, msg.sender, _price);
    }

    function cancelListing(uint256 _tokenId) external isOwner(_tokenId, msg.sender) listingExists(_tokenId) {
        delete listings[_tokenId];
        _removeTokenId(_tokenId);
        emit ItemCanceled(_tokenId, msg.sender);
    }

    function buyItem(uint256 _tokenId) external payable nonReentrant listingExists(_tokenId) {
        Listing memory item = listings[_tokenId];
        require(msg.value == item.price, "Send exact price");

        delete listings[_tokenId];
        _removeTokenId(_tokenId);

        payable(item.seller).transfer(msg.value);
        nftContract.safeTransferFrom(item.seller, msg.sender, _tokenId);

        emit ItemBought(_tokenId, msg.sender, item.price);
    }

    function getAllListings() external view returns (uint256[] memory, Listing[] memory) {
        Listing[] memory items = new Listing[](listedTokenIds.length);
        
        for (uint256 i = 0; i < listedTokenIds.length; i++) {
            items[i] = listings[listedTokenIds[i]];
        }
        
        return (listedTokenIds, items);
    }

    function _removeTokenId(uint256 _tokenId) private {
        for (uint256 i = 0; i < listedTokenIds.length; i++) {
            if (listedTokenIds[i] == _tokenId) {
                listedTokenIds[i] = listedTokenIds[listedTokenIds.length - 1];
                listedTokenIds.pop();
                break;
            }
        }
    }
    
    // Оновлення адреси NFT контракту (тільки для власника)
    function setNftContract(address _nftContract) external onlyOwner {
        nftContract = IERC721(_nftContract);
    }
}