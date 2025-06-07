// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MarketplaceMulti is ReentrancyGuard, Ownable {
    struct Listing {
        address seller;
        uint256 price;
    }

    struct Key {          
        address nft;
        uint256 tokenId;
    }

    mapping(address => mapping(uint256 => Listing)) public listings;
    Key[] public listedKeys;

    event ItemListed(address indexed nft, uint256 indexed tokenId, address seller, uint256 price);
    event ItemCanceled(address indexed nft, uint256 indexed tokenId, address seller);
    event ItemBought  (address indexed nft, uint256 indexed tokenId, address buyer, uint256 price);

    function listItem(address _nft, uint256 _tokenId, uint256 _price) external {
        require(_price > 0, "Price must be >0");

        IERC721 nft = IERC721(_nft);
        require(nft.ownerOf(_tokenId) == msg.sender, "Not owner");
        require(nft.getApproved(_tokenId) == address(this), "Marketplace not approved");

        listings[_nft][_tokenId] = Listing(msg.sender, _price);
        listedKeys.push(Key(_nft, _tokenId));

        emit ItemListed(_nft, _tokenId, msg.sender, _price);
    }

    function cancelListing(address _nft, uint256 _tokenId) external {
        Listing memory l = listings[_nft][_tokenId];
        require(l.seller == msg.sender, "Not seller");

        delete listings[_nft][_tokenId];
        _removeKey(_nft, _tokenId);

        emit ItemCanceled(_nft, _tokenId, msg.sender);
    }

    function buyItem(address _nft, uint256 _tokenId) external payable nonReentrant {
        Listing memory l = listings[_nft][_tokenId];
        require(l.price > 0, "Not listed");
        require(msg.value == l.price, "Send exact price");

        delete listings[_nft][_tokenId];
        _removeKey(_nft, _tokenId);

        payable(l.seller).transfer(msg.value);
        IERC721(_nft).safeTransferFrom(l.seller, msg.sender, _tokenId);

        emit ItemBought(_nft, _tokenId, msg.sender, l.price);
    }

    function getAllListings() external view returns (Key[] memory, Listing[] memory) {
        uint256 len = listedKeys.length;
        Listing[] memory ls = new Listing[](len);

        for (uint256 i; i < len; ++i) {
            Key memory k = listedKeys[i];
            ls[i] = listings[k.nft][k.tokenId];
        }
        return (listedKeys, ls);
    }

    function _removeKey(address _nft, uint256 _tokenId) private {
        uint256 len = listedKeys.length;
        for (uint256 i; i < len; ++i) {
            if (listedKeys[i].nft == _nft && listedKeys[i].tokenId == _tokenId) {
                listedKeys[i] = listedKeys[len - 1];
                listedKeys.pop();
                break;
            }
        }
    }

    constructor() Ownable(msg.sender) {}
}