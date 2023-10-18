import React from 'react';
import stakeContractData from "../abi/stake_abi"
import Web3 from 'web3';
import { useTranslation } from 'react-i18next';
import poolContractData from "../abi/pool_abi"

const { poolContractABI } = poolContractData

const { stakeContractABI, stakeContractAddress } = stakeContractData

const DataDisplay = ({ url, provider, urlType }) => {
    const [stakersCount, setStakersCount] = React.useState(0);
    const [badTokens, setBadTokens] = React.useState(0);
    const [safeTokens, setSafeTokens] = React.useState(0);
    const [score, setScore] = React.useState(0);
    var deliveryDates = [1688054400, 1696003200, 1703952000]
    const { t } = useTranslation();

    React.useEffect(() => {
        const fetchContractData = async () => {
            console.log(`获取到的url为:${url}`)
            // 在此处调用智能合约并更新状态
            if (provider) {
                const web3Instance = new Web3(provider);
                // 与智能合约交互
                await getPoolDetail(web3Instance, url);
            } else {
                console.log("请先连接钱包")
            }
            // 例如：
            // const newStakersCount = await contract.getStakersCount();
            // setStakersCount(newStakersCount);

            // 根据你的智能合约方法来调用并更新其他状态
        };
        // 进行质押
        const getPoolDetail = async (web3, url) => {

            const contract = new web3.eth.Contract(stakeContractABI, stakeContractAddress);

            // 从钱包获取当前地址
            const accounts = await web3.eth.getAccounts();
            const currentAccount = accounts[0];
            // 当前用户
            console.log(currentAccount)
            // 调用智能合约函数
            try {
                if (checkData(url, urlType)) {
                    url = getTopLevelDomain(url);
                }

                console.log(url)
                let websiteInfo = new Object();
                websiteInfo.url = url
                websiteInfo.upvotes = 0
                websiteInfo.downvotes = 0
                websiteInfo.pool_trade_times = 0
                websiteInfo.score = 0
                let upvotesBN = web3.utils.toBN(0)
                let downvotesBN = web3.utils.toBN(0)
                for (var j = 0; j < 1; j++) {

                    const poolAddress = await contract.methods.getStakingContract(url, j).call();
                    console.log("Pool address:", poolAddress);
                    if (poolAddress == '0x0000000000000000000000000000000000000000') {
                        continue;
                    }
                    const poolContract = new web3.eth.Contract(poolContractABI, poolAddress);
                    const poolInfo = await poolContract.methods.getAllStateVariables().call();
                    const rank = await poolContract.methods.rank().call();
                    console.log(`${rank}`)
                    // const poolData = {
                    //     totalDownStake: poolInfo[0],
                    //     totalUpStake: poolInfo[1],
                    //     upLossPool: poolInfo[2],
                    //     downLossPool: poolInfo[3],
                    //     endTimeOfArbitration: poolInfo[4],
                    //     expirationTimestamp: poolInfo[5],
                    //     isInArbitration: poolInfo[6],
                    // };

                    upvotesBN = upvotesBN.add(web3.utils.toBN(poolInfo[1]))
                    downvotesBN = downvotesBN.add(web3.utils.toBN(poolInfo[0]))
                    websiteInfo.pool_trade_times += parseInt(rank);
                }
                websiteInfo.upvotes = web3.utils.fromWei(upvotesBN, 'ether');
                websiteInfo.downvotes = web3.utils.fromWei(downvotesBN, 'ether');
                websiteInfo.score += Math.floor(Math.random() * (websiteInfo.upvotes - websiteInfo.downvotes)) + 1;
                console.log(websiteInfo);
                setStakersCount(websiteInfo.pool_trade_times)
                setBadTokens(websiteInfo.downvotes)
                //setScore(websiteInfo.score)
                setSafeTokens(websiteInfo.upvotes)
            } catch (error) {
                //alert("合约函数调用失败")
                console.error('合约函数调用失败', error);
            }
        }

        // 获取顶级域名
        function getTopLevelDomain(myUrl) {
            try {

                if (myUrl.indexOf(":") == -1) {
                    const urlParts = myUrl.split('.');
                    // 该情况为顶级域名
                    if (urlParts.length == 2) {
                        return myUrl
                    }
                }
                const urlObject = new URL(myUrl);
                const hostname = urlObject.hostname;
                const domainParts = hostname.split('.');
                const topLevelDomain = domainParts.slice(-2).join('.');
                return topLevelDomain;
            } catch (error) {
                //alert(`${myUrl}不是顶级域名`)
                console.error('Invalid URL:', error);
                return "";
            }
        }

        function checkData(url, type) {
            console.log("check url" + type)
            switch (type) {
                case 'Website':

                    if (url.endsWith('.eth') && !url.startsWith('@')) {
                        return true
                    }
                    break;
                case 'Twitter':
                    if (url.startsWith('@')) {
                        return false
                    }
                    break;
                case 'ENS':
                    if (url.endsWith('@')) {
                        return false
                    }
                    break;
            }

            return true;
        }

        const timer = setInterval(() => {
            fetchContractData();
        }, 5000);

        return () => clearInterval(timer);
    }, [url]);

    return (
        <div className="data">
            <div className='data-word-wrap'>
                <div className='data-word'>
                    <div className="data-name">{t("Staker Count")}</div>
                    <div className="data-number">{stakersCount}</div>
                </div>
                <div className='data-word'>
                    <div className="data-name">{t("Premium Rate")}</div>
                    <div className="data-number">10%</div>
                </div>
                <div className='data-word'>
                    <div className="data-name">{t("Score")}</div>
                    <div className="data-number">{score}</div>
                </div>
                <div className='data-word'>
                    <div className='risky'>
                        <div className="data-name">{t("Risky Token Stake")}</div>
                        <div className="data-number">{badTokens}</div>
                    </div>
                </div>
                <div className='data-word'>
                    <div className='safe'>
                        <div className="data-name">{t("Safe Token Stake")}</div>
                        <div className="data-number">{safeTokens}</div>
                    </div>
                </div>
            </div>
            <div className='data-info-wrap'>
                <div className='data-info'>
                    <div className='info-title'>{t("DataInfoTitle")}</div>
                    <div className='info-text'>
                        <div className='info-star'>*</div>
                        {t("DataInfo1")}
                    </div>
                    <div className='info-text'>
                        <div className='info-star'>*</div>
                        {t("DataInfo2")}
                    </div>
                    <div className='info-text'>
                        <div className='info-star'>*</div>
                        {t("DataInfo3")}
                    </div>
                    <div className='info-text'>
                        <div className='info-star'>*</div>
                        {t("DataInfo4")}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataDisplay;
