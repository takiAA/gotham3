// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract StakeContract {
    struct Staker {
        uint256 unixTime;
        uint256 amount;
        uint256 reaminSec;
        uint256 score;
        bool isUp;
    }
    struct VoteInfo{
        bool isUp;
        bool isVoted;
    }
    struct ArbitrationInitiator{
        address initiatorAddress;
        bool isUp;
        bool isCorrect;
        uint256 amount;
        
    }
    enum ArbitrationStatus {
        AutomaticArbitrate,
        ArbitrationInvalid,
        ArbitrationValid
    }

    ArbitrationStatus public status;


    IERC20 immutable token;
    IERC721 immutable SBT;
    //address immutable owner;
    uint256 public totalDownStake;
    uint256 public totalUpStake;
    uint256 public upLossPool;
    uint256 public downLossPool;
    Staker[] public upStakers;
    Staker[] public downStakers;
    mapping(address => Staker) public userinfo;
    mapping (address => VoteInfo) public voteInfos;
    uint256 public totalUpScore;
    uint256 public totalDownScore;
    uint256 public rank;
    uint256 public finalUpStake;
    uint256 public finalDownStake;
    uint256 public lastUpdateTime;
    string   public   website;
    uint256 public expirationTimestamp;
    uint256 public APR;
    address public stakeFactorAddress;
    uint256 public immutable  DAYS_IN_YEAR = 365;
    uint256 public  immutable SECONDS_IN_DAY = 86400;
    uint256 public upVote;
    uint256 public downVote;
    uint256 public endTimeOfArbitration;
    uint256 public  ArbitrationRewardPool;
    uint256 public ArbitratorAmount;
    ArbitrationInitiator public initiator;
    bool public isInArbitration;
    
    // modifier onlyOwner() {
    //     require(msg.sender==owner,"only Owner");
    //     _;
    // }

    modifier onlyFactory() {
        require(msg.sender==stakeFactorAddress,"only factory");
        _;
    }
    // only one
    bool private initialized;
    bool private isBase;

    constructor(IERC20 _token,IERC721 _SBT){
        //owner=msg.sender;
        token=_token;
        SBT = _SBT;
        isBase=true;
    }

    function initialize(address _stakeFactorAdress, string memory _website, uint256 _lockDuration, uint _APR,uint256 amount,bool isUp,address creator) external {
        require(!initialized, "Contract instance has already been initialized");
        require(!isBase,"base contract cannot initialize");
        initialized = true;
        //token=_token;
        website=_website;
        expirationTimestamp = block.timestamp + _lockDuration;
        APR = _APR;
        stakeFactorAddress=_stakeFactorAdress;
        endTimeOfArbitration=expirationTimestamp + SECONDS_IN_DAY;
        _stake(amount, isUp, creator);
        //SBT = _SBT;
    }

    //event Staked(address indexed user, uint256 amount, bool isUp);
    event Unstaked(address indexed user, uint256 amount);
    event GetProfit(address indexed user,uint256 amount);
    event DeterminedArbitration(ArbitrationStatus _statu);

    event LossPoolUpdated(
    uint256 timestamp,
    uint256 downLossPool,
    uint256 upLossPool,
    uint256 totalDownStake,
    uint256 totalUpStake
);

    function _stake(uint256 amount, bool isUp,address stakerAddress) internal {
        uint256 remainingTime = expirationTimestamp - block.timestamp;
        require(remainingTime> 0, "Staking period has ended");
        updateLossPool();
        ++rank;
        Staker memory staker = Staker(block.timestamp, amount, remainingTime, calculateAndUpdateScore(amount, isUp), isUp);
        userinfo[stakerAddress] = staker;
        if (isUp) {
            totalUpStake += amount;
            upStakers.push(staker);
        } else {
            totalDownStake += amount;
            downStakers.push(staker);
        }
    }

    function stake(uint256 amount, bool isUp,address stakerAddress) external onlyFactory  {
        require(amount > 0, "require amount>0");
        require(userinfo[stakerAddress].amount == 0, "already staked");
        _stake(amount,isUp,stakerAddress);
    }

    function unstake()  external  returns(uint256){
        require(status==ArbitrationStatus.ArbitrationValid,"ArbitrationInvalid");
        require(userinfo[msg.sender].amount > 0, "not any stake");
        uint256 share;
        if (userinfo[msg.sender].isUp) {
            share = downLossPool * userinfo[msg.sender].score / totalUpScore;
            share += finalUpStake * userinfo[msg.sender].amount / (totalUpStake + upLossPool);
        } else {
            share = upLossPool * userinfo[msg.sender].score / totalDownScore;
            share += finalDownStake * userinfo[msg.sender].amount / (totalDownStake + downLossPool);
        }
        getStakeProfit();
        delete userinfo[msg.sender];
        if (share==0){
            return 0;
        }
        token.transfer(msg.sender,share);
        emit Unstaked(msg.sender, share);
        return share;
    }

    function getAllStateVariables() public view returns (uint256, uint256, uint256, uint256, uint256, uint256, bool) {
        return (totalDownStake, totalUpStake, upLossPool, downLossPool, endTimeOfArbitration, expirationTimestamp, isInArbitration);
    }


    function calculateAndUpdateScore(uint256 amount, bool isUp) internal returns (uint256) {
        uint256 EAA = 100 - rank;
        uint256 score = block.timestamp * EAA * amount/100;
        if (isUp) {
            totalUpScore += score;
        } else {
            totalDownScore += score;
        }
        return score;
    }

    function arbitrationVote(bool _isUp,address voterAddress) external onlyFactory {
        //require(msg.sender==stakeFactorAddress,"Only the staking factory can stake");
        require(isInArbitration==true,"Arbitration Not Initiated");
        require(SBT.balanceOf(voterAddress)>0,"permission denied");
        require(block.timestamp<endTimeOfArbitration,"Not in Arbitration Period");
        require(voteInfos[voterAddress].isVoted==false,"You have voted.");
        if (_isUp){
            upVote+=1;
        }else{
            downVote+=1;
        }
        ArbitratorAmount++;
        voteInfos[voterAddress]=VoteInfo(_isUp,true);
    }

    function initiateArbitration(bool isUp,address user) external onlyFactory  {
        isInArbitration=true;
        initiator.isUp=isUp;
        initiator.initiatorAddress=user;
        initiator.amount=calcInitiateAmount();
        endTimeOfArbitration=block.timestamp+SECONDS_IN_DAY;
        if (expirationTimestamp>block.timestamp){
            expirationTimestamp=block.timestamp;
        }
    }

    function calcInitiateAmount() public  view returns (uint256) {
        return (totalDownStake+totalUpStake+upLossPool+downLossPool)/2;
    }

    function determinedArbitration() external  {
        require(block.timestamp>endTimeOfArbitration,"still in Arbitration Period");
        require(status!=ArbitrationStatus.ArbitrationValid,"Arbitration concluded.");
        updateLossPool();
        if (initiator.initiatorAddress==address(0) && status==ArbitrationStatus.AutomaticArbitrate){
            autoArbitrate();
            emit DeterminedArbitration(status);
            return ;
        }
        if (ArbitratorAmount <5 && status==ArbitrationStatus.AutomaticArbitrate){
            uint256  initiateStake=initiator.amount; 
            endTimeOfArbitration+=SECONDS_IN_DAY;
            if (initiator.isUp){
                totalUpStake+=initiateStake;
            }else{
                totalDownStake+=initiateStake;
            }
            status=ArbitrationStatus.ArbitrationInvalid;
            emit DeterminedArbitration(status);
            return ;
        }
        if (upVote > downVote){
            if (initiator.isUp){
                initiator.isCorrect=true;
            }
            ArbitrationRewardPool+=totalDownStake*30/100;
            finalUpStake=totalDownStake-ArbitrationRewardPool+totalUpStake;
            isInArbitration=false;
            status=ArbitrationStatus.ArbitrationValid;
            emit DeterminedArbitration(status);
        }else if(upVote < downVote){
            if (initiator.initiatorAddress!=address(0)&&!initiator.isUp){
                initiator.isCorrect=true;
            }
            // 
            ArbitrationRewardPool+=totalUpStake*30/100;
            finalDownStake=totalUpStake-ArbitrationRewardPool+totalDownStake;
            isInArbitration=false;
            status=ArbitrationStatus.ArbitrationValid;
            emit DeterminedArbitration(status);
        } else {
            status=ArbitrationStatus.ArbitrationInvalid;
            endTimeOfArbitration=block.timestamp+SECONDS_IN_DAY;
            emit DeterminedArbitration(status);
        }
        
    }

    function releaseArbitrationReward() external  {
        require(block.timestamp>endTimeOfArbitration && status==ArbitrationStatus.ArbitrationValid,"In Arbitration Period");
        require(voteInfos[msg.sender].isVoted==true || msg.sender==initiator.initiatorAddress,"You haven't voted.");
        bool voteResult= upVote > downVote;
        uint256 voterAmount;
        if (voteResult){
            voterAmount=upVote;
        }else{
            voterAmount=downVote;
        }
        // 
        if (initiator.isCorrect){
            if (msg.sender==initiator.initiatorAddress){
                // 2/3 wait to optimized
                token.transfer(msg.sender, ArbitrationRewardPool * 2/3+initiator.amount);
                initiator.initiatorAddress=address(0);
                return;
            }else{
                if(voteInfos[msg.sender].isUp==voteResult){
                    // 1/3  wait to optimized
                    token.transfer(msg.sender, ArbitrationRewardPool /3/voterAmount);
                }
            }
        }else{
            if(voteInfos[msg.sender].isUp==voteResult){
                    // 1/3  wait to optimized
                token.transfer(msg.sender, ArbitrationRewardPool /voterAmount);
            }
        }
        delete voteInfos[msg.sender];
    }

    function autoArbitrate() internal {
        if (totalUpStake > totalDownStake * 125 / 100) {
            finalUpStake = totalUpStake + totalDownStake;
            isInArbitration=false;
            status=ArbitrationStatus.ArbitrationValid;
        } else if (totalDownStake > totalUpStake * 125 / 100) {
            finalDownStake = totalDownStake + totalUpStake;
            isInArbitration=false;
            status=ArbitrationStatus.ArbitrationValid;
        } else{
            status=ArbitrationStatus.ArbitrationInvalid;
            endTimeOfArbitration=block.timestamp+SECONDS_IN_DAY;
        }
    }

    function getStakeProfit() internal {
        require(userinfo[msg.sender].amount > 0,"not any stake");
        uint256 amount=calculateStakeProfit();
        token.transferFrom(stakeFactorAddress, msg.sender, amount);
        emit GetProfit(msg.sender, amount);
    }

    function calculateStakeProfit() public view   returns(uint256){
        require(userinfo[msg.sender].amount > 0,"not any stake");
        return userinfo[msg.sender].amount*APR*userinfo[msg.sender].reaminSec/SECONDS_IN_DAY/DAYS_IN_YEAR/1000;
    }

    function updateLossPool() internal {
        if (lastUpdateTime==block.timestamp+1 || lastUpdateTime>expirationTimestamp){
            return ;
        }
        uint256  _timeNow=block.timestamp;
        if (expirationTimestamp<block.timestamp){
            _timeNow=expirationTimestamp;
        }
        uint256 n = _timeNow- lastUpdateTime + 1;
        uint256 sumTemp;
        uint256  arraylen;
        uint256 commonExpression = n * (_timeNow + lastUpdateTime) / 2;

        if (totalUpStake > totalDownStake) {
            arraylen=downStakers.length;
            for (uint256 j = 0; j < arraylen; ++j) {
                sumTemp += downStakers[j].amount * (commonExpression - n * downStakers[j].unixTime) / downStakers[j].reaminSec**2;
            }
            downLossPool += 2 * sumTemp;
            totalDownStake -= 2 * sumTemp;
        } else if (totalDownStake > totalUpStake) {
            arraylen=upStakers.length;
            for (uint256 j = 0; j < arraylen; ++j) {
                sumTemp += upStakers[j].amount * (commonExpression- n * upStakers[j].unixTime) / upStakers[j].reaminSec**2;
            }
            upLossPool += 2 * sumTemp;
            totalUpStake -= 2 * sumTemp;
        }
        lastUpdateTime = block.timestamp + 1;
        if (sumTemp>0){
            emit LossPoolUpdated(block.timestamp, downLossPool, upLossPool, totalDownStake, totalUpStake);
        }
    }
}
