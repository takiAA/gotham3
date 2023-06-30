//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

enum ArbitrationStatus {
    AutomaticArbitrate,
    ArbitrationInvalid,
    ArbitrationValid
}
interface IStakeContract {
    //function isArbitrated() external view returns (bool);
    function stake(uint256 amount, bool isUp, address sender) external;
    function arbitrationVote(bool isUp, address sender) external;
    function initiateArbitration(bool isUp, address sender) external;
    function calcInitiateAmount() external view returns (uint256);
    function endTimeOfArbitration() external view returns (uint256);
    function isInArbitration() external view returns (bool);
    function initialize( address _stakeFactorAdress, string memory _website, uint256 _lockDuration, uint _APR,uint256 amount,bool isUp,address creator) external;
    function status() external view returns (ArbitrationStatus);
}


contract StakingFactory {

    IERC20 immutable public   token;
    IERC721 immutable public SBT;
    IStakeContract  immutable public stakeContractTemplate;


    constructor(IERC20 _token,IERC721 _SBT,IStakeContract _stakeContractTemplate) {
        token=_token;
        SBT=_SBT;
        stakeContractTemplate=_stakeContractTemplate;
    }
    struct StakingInfo {
        string website;
        uint256 amount;
        bool isUp;
    }

    // struct WebsiteStakingInfo {
    //     IStakeContract[3] contracts;
    // }

    mapping(string => IStakeContract) private websiteStakingContracts;
    //10min 20min 30min
    uint256[3] lockDurations = [86400*3, 86400*2, 86400*3];
    // 10% 20% 30%
    uint256[3] APRs = [100,100,100];

    function getStakingContract(string memory _website, uint8 _lockDurationIndex) public view  returns (address){
        //IStakeContract memory websiteInfo = websiteStakingContracts[_website];
        IStakeContract  stakeContract = websiteStakingContracts[_website];
        if (address(stakeContract)==address(0)){
            return address(0);
        }
        if (stakeContract.status()!=ArbitrationStatus.ArbitrationValid) {
            return address(stakeContract);
        }
        return address(0);
    }

    event CreateStakeContract(bytes32 indexed website,address indexed  creator,uint256 indexed lockDuration,address stakePool,uint256 amount, bool isUp);

    event Voted(address indexed user,string website,address poolAddress,uint8 _lockDurationIndex,bool isUp);

    event Staked(bytes32 indexed website,address indexed poolAddress,address indexed user,uint8 _lockDurationIndex, uint256 amount, bool isUp);
    event InitiateArbitrated(bytes32 indexed website,address indexed user,uint8 _lockDurationIndex,address  poolAddress);



    function createStakingContract(string memory _website, uint8 _lockDurationIndex,uint256 amount,bool isUp) public returns (address) {
        require(_lockDurationIndex < 3, "Invalid lock duration index");
        address poolAddress = getStakingContract(_website, _lockDurationIndex);
        require(poolAddress==address(0),"Staking period is still active");
        //WebsiteStakingInfo storage websiteInfo = websiteStakingContracts[_website];

        //WebsiteStaking[] memory contractsArray = websiteInfo.contracts[_lockDurationIndex];
        address clone =Clones.clone(address(stakeContractTemplate));
        IStakeContract(clone).initialize(address(this),_website,lockDurations[_lockDurationIndex],APRs[_lockDurationIndex],amount,isUp,msg.sender);
        //IStakeContract newStakeContract = new IStakeContract(token,SBT,address(this),_website,lockDurations[_lockDurationIndex],APRs[_lockDurationIndex]);
        websiteStakingContracts[_website]=IStakeContract(clone);
        token.approve(clone, token.balanceOf(address(this)));
        token.transferFrom(msg.sender, clone, amount);
        emit CreateStakeContract(bytes32(abi.encodePacked(_website)),msg.sender ,lockDurations[_lockDurationIndex], clone,amount,isUp);
        return clone;
    }

    function stakeOnContract(string memory _website, uint8 _lockDurationIndex, uint256 amount, bool isUp) public {
    // Get the staking contract
        IStakeContract stakeContract = IStakeContract(getStakingContract(_website, _lockDurationIndex));
        require(address(stakeContract) != address(0), "No active staking contract");
        //require(token.allowance(msg.sender, address(this))>=amount,"Insufficient allowance");
        token.transferFrom(msg.sender,address(stakeContract), amount);

        // Stake on the contract
        stakeContract.stake(amount, isUp,msg.sender);
        emit Staked(bytes32(abi.encodePacked(_website)),address(stakeContract),msg.sender,_lockDurationIndex,amount,isUp);
    }

    function voteOnContract(string memory _website, uint8 _lockDurationIndex, bool isUp) external  {
        // Get the staking contract
        IStakeContract stakeContract = IStakeContract(getStakingContract(_website, _lockDurationIndex));
        require(address(stakeContract) != address(0), "No active staking contract");

        // Vote on the contract
        stakeContract.arbitrationVote(isUp,msg.sender);
        emit Voted(msg.sender,_website,address(stakeContract),_lockDurationIndex,isUp);
    }

    function initiateArbitrationOnContract(string memory _website,uint8 _lockDurationIndex,bool isUp) external{
        IStakeContract stakeContract = IStakeContract(getStakingContract(_website, _lockDurationIndex));
        require(address(stakeContract) != address(0), "No active staking contract");
        require(stakeContract.isInArbitration()==false,"in Arbitration Period");
        uint256 initiateAmount=stakeContract.calcInitiateAmount();
        require(token.allowance(msg.sender, address(this))>=initiateAmount,"no enough token");
        require(block.timestamp<stakeContract.endTimeOfArbitration(),"Staking has ended.");
        token.transferFrom(msg.sender, address(stakeContract), initiateAmount);
        stakeContract.initiateArbitration(isUp,msg.sender);
        emit  InitiateArbitrated(bytes32(abi.encodePacked(_website)),msg.sender,_lockDurationIndex,address(stakeContract));
    }

    function batchStake(bytes calldata data) external {
        StakingInfo[] memory stakingInfos = abi.decode(data, (StakingInfo[]));
        uint256 len=stakingInfos.length;
        for (uint i = 0; i < len; ++i) {
            StakingInfo memory stakingInfo = stakingInfos[i];
            address poolAddress = getStakingContract(stakingInfo.website, 0);

            if (poolAddress == address(0)) {
                createStakingContract(stakingInfo.website, 0, stakingInfo.amount, stakingInfo.isUp);
            } else {
                stakeOnContract(stakingInfo.website, 0, stakingInfo.amount, stakingInfo.isUp);
            }
        }
    }


}

