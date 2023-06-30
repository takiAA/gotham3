// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.13;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC5192} from "./IERC5192.sol";

contract ERC5192 is ERC721, IERC5192 {
  bool private isLocked;
  address private owner;
  uint256 private _tokenIds;

  // Mapping from token ID to token URIs
  mapping (uint256 => string) private _tokenURIs;

  // mapping from address to role
  mapping (address => bool) private _roles;

  // Mapping from token ID to owner address
  mapping (address => uint256) private _tokenMap;

  event Revoke(address indexed from ,uint256 tokenId);

  error ErrLocked();
  error ErrNotFound();
  error ErrNotOwner();
  error ErrNotRole();

  constructor(string memory _name, string memory _symbol, bool _isLocked)
    ERC721(_name, _symbol)
  {
    isLocked = _isLocked;
    owner = msg.sender;
  }

  modifier checkLock() {
    if (isLocked) revert ErrLocked();
    _;
  }

  modifier checkRole() {
    if (!_roles[msg.sender]) revert ErrNotRole();
    _;
  }


  modifier onlyOwner() {
    if (msg.sender != owner) revert ErrNotOwner();
    _;
  }

  function setRole(address to) public onlyOwner {
    _roles[to]=true;
  }

  function batchSetRole(address[] calldata addrs) external onlyOwner {
    uint256 addrLength = addrs.length;
    require(addrLength <= 100, "The max length of addresses is 100");
    for (uint8 i = 0; i < addrLength; i++){
      address to = addrs[i];
      if (to == address(0) ) {
        continue;
      }
      setRole(to);
    }
  }

  function revoke(address from) external onlyOwner{
    require(from != address(0), "Address is empty");
    uint256 tokenId = _tokenMap[from];
    require(tokenId!=0,"The account does not have any SBT");
    delete _tokenMap[from];
    delete _tokenURIs[tokenId];
    delete _roles[from];
    _burn(tokenId);
  }

  function batchRevoke(address[] calldata addrs) external onlyOwner {
    uint256 addrLength = addrs.length;
    require(addrLength <= 100, "The max length of addresses is 100");
    for (uint8 i = 0; i < addrLength; i++) {
            address from = addrs[i];
            uint256 tokenId = _tokenMap[from];
            if (from == address(0) || tokenId==0){
                continue;
            }

            delete _tokenMap[from];
            delete _tokenURIs[tokenId];
            delete _roles[from];
            emit Revoke(from, tokenId);
            _burn(tokenId);
        }
  }

  function hasRole(address recipient) public view returns (bool) {
    return _roles[recipient];
  }

  function locked(uint256 tokenId) external view returns (bool) {
    if (!_exists(tokenId)) revert ErrNotFound();
    return isLocked;
  }

  function safeTransferFrom(
    address from,
    address to,
    uint256 tokenId,
    bytes memory data
  ) public override checkLock {
    super.safeTransferFrom(from, to, tokenId, data);
  }

  function safeTransferFrom(address from, address to, uint256 tokenId)
    public
    override
    checkLock
  {
    super.safeTransferFrom(from, to, tokenId);
  }

  function transferFrom(address from, address to, uint256 tokenId)
    public
    override
    checkLock
  {
    super.transferFrom(from, to, tokenId);
  }

  function approve(address approved, uint256 tokenId) public override checkLock {
    super.approve(approved, tokenId);
  }

  function setApprovalForAll(address operator, bool approved)
    public
    override
    checkLock
  {
    super.setApprovalForAll(operator, approved);
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override
    returns (bool)
  {
    return interfaceId == type(IERC5192).interfaceId
      || super.supportsInterface(interfaceId);
  }

  // New functions

  function mintNFT( string calldata _tokenURI) external checkRole {
    require(super.balanceOf(msg.sender)==0,"only have one");
    _tokenIds++;
    _mint(msg.sender, _tokenIds);
    _setTokenURI(_tokenIds, _tokenURI);
    _tokenMap[msg.sender]=_tokenIds;
  }

  function _setTokenURI(uint256 tokenId, string calldata _tokenURI) internal virtual {
    _tokenURIs[tokenId] = _tokenURI;
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    return _tokenURIs[tokenId];
  }
}
