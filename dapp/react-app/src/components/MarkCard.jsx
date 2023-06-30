import React from "react";
import Web3 from 'web3';
import stakeContractData from "../abi/stake_abi"
import tokenContractData from "../abi/token_abi"
import poolContractData from "../abi/pool_abi"
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_URLS } from "../../config/apiUrl";
import { useTranslation } from 'react-i18next';

const { stakeContractABI, stakeContractAddress } = stakeContractData
const { erc20ABI, erc20Address } = tokenContractData
const { poolContractABI } = poolContractData

const MarkCard = ({ url, provider }) => {
    const [tokenNumber, setTokenNumber] = React.useState(0);
    const [balance, setBalance] = React.useState(0);
    const [selectedTime, setSelectedTime] = React.useState("0");
    const { t, i18n } = useTranslation();
    const badType = "bad";
    const safeType = "safe";
    React.useEffect(() => {
        getBalance()
            .then(amount => setBalance(amount));
    
        const interval = setInterval(() => {
            getBalance()
                .then(amount => setBalance(amount));
        }, 180000); // 180000 毫秒 = 3 分钟
    
        // 清理函数，当组件卸载时取消 interval
        return () => clearInterval(interval);
    }, [provider]);

    // 获取余额
    async function getBalance() {
        if (provider) {
          const web3 = new Web3(provider);
          // 与智能合约交互
    
          // 从钱包获取当前地址
          const accounts = await web3.eth.getAccounts();
          const currentAccount = accounts[0];
          // 当前用户
          console.log(currentAccount)
          const erc20Contract = new web3.eth.Contract(erc20ABI, erc20Address);
          const balance=await erc20Contract.methods.balanceOf(currentAccount).call()
          return web3.utils.fromWei(balance,'ether')
        }
        return 0
      }
    // 处理点击事件
    const handleSubmit = async (type, tokenNumber, selectedTime) => {
        const topLevelDomain = getTopLevelDomain(url);
        if (topLevelDomain == "") {
            return
        }
        //toast.success(`${url}` + t("top domain") + `${topLevelDomain}`);
        //toast.success(t("type:") + type + t("token number") + tokenNumber + "selected time:" + selectedTime);
        console.log("Token Number: ", tokenNumber);
        console.log("Selected Time: ", selectedTime);
        // 1. 连接到智能合约
        if (provider) {
            const web3Instance = new Web3(provider);
            // 与智能合约交互
            await stake(type, web3Instance, topLevelDomain);
        } else {
            toast.warn(t("connect first"));
        }
    };
    // 进行质押
    const stake = async (type, web3, url) => {
        //erc20
        const erc20Contract = new web3.eth.Contract(erc20ABI, erc20Address);
        const contract = new web3.eth.Contract(stakeContractABI, stakeContractAddress);

        // 从钱包获取当前地址
        const accounts = await web3.eth.getAccounts();
        const currentAccount = accounts[0];
        const isSafe =
            type === "bad" ? false : true;
        // 质押数量
        console.log(tokenNumber)
        let stakeAmount = web3.utils.toBN('1000000000000000000')
        stakeAmount = stakeAmount.mul(web3.utils.toBN(tokenNumber))
        console.log(stakeAmount.toString())
        //alert(isSafe)
        // 调用智能合约函数
        try {
            let urlPoolAddress = await contract.methods.getStakingContract(url, selectedTime).call({ from: currentAccount });
            console.log(`getStakingContract:${urlPoolAddress}`)
            let allowanceAmount = await erc20Contract.methods.allowance(currentAccount, stakeContractAddress).call({ from: currentAccount })
            if (allowanceAmount < stakeAmount) {
                await erc20Contract.methods.approve(stakeContractAddress, stakeAmount).send({ from: currentAccount });
            }
            if (urlPoolAddress == "0x0000000000000000000000000000000000000000") {
                toast.warn(t("no pool"))
                contract.once('CreateStakeContract', { filter: { creator: currentAccount }, fromBlock: 'latest' }, (error, event) => {
                    if (error) console.error(error);
                    else {
                        let share = event.returnValues.amount;  // 根据你的事件定义获取相关数据
                        share = web3.utils.fromWei(share, 'ether')
                        toast.success(`You have successfully staked ${share}BAT.`);
                    }
                });
                await contract.methods.createStakingContract(url, selectedTime, stakeAmount, isSafe).send({ from: currentAccount });
                console.log(`createStakingContract:${urlPoolAddress}`)
                //toast.success(`${url}` + t("pool create"))
                return
                //urlPoolAddress = await contract.methods.getStakingContract(url, selectedTime).call({ from: currentAccount });
                // await erc20Contract.methods.approve(urlPoolAddress, stakeAmount).send({ from: currentAccount });
                // console.log(t("function success") + url);
                // await axios.get(`${API_URLS.addBannedUrl}?attachUrl=${url}`);
            }
            const poolContract = new web3.eth.Contract(poolContractABI, urlPoolAddress);
            let isInArbitration = await poolContract.methods.isInArbitration().call()
            if (isInArbitration) {
                toast.warn("Arbitration has been initiated");
                return
            }
            // let allowanceAmount = await erc20Contract.methods.allowance(currentAccount, stakeContractAddress).call({ from: currentAccount })
            // if (allowanceAmount < stakeAmount) {
            //     await erc20Contract.methods.approve(stakeContractAddress, stakeAmount).send({ from: currentAccount });
            // }
            //console.log('合约函数调用成功' + url);
            contract.once('Staked', { filter: { creator: currentAccount }, fromBlock: 'latest' }, (error, event) => {
                if (error) console.error(error);
                else {
                    let share = event.returnValues.amount;  // 根据你的事件定义获取相关数据
                    share = web3.utils.fromWei(share, 'ether')
                    toast.success(`You have successfully staked ${share}BAT.`);
                }
            });
            await contract.methods.stakeOnContract(url, selectedTime, stakeAmount, isSafe).send({ from: currentAccount });
            // const poolContract = new web3.eth.Contract(poolContractABI, urlPoolAddress);
            // await poolContract.methods.stake(stakeAmount, isSafe).send({ from: currentAccount });
            //await axios.get(`${API_URLS.addBannedUrl}?attachUrl=${url}`);
            toast.success(t("stake success") + url)

        } catch (error) {
            toast.error(t("function fail"))
            console.error(t("function fail"), error);
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
            toast.error(`${myUrl}` + t("not top domain"))
            console.error('Invalid URL:', error);
            return "";
        }
    }
    const setTime = async (t) => {
        setSelectedTime(t);
    }
    return (
        <>
            <div className='mark-card'>
                <div className="mark-info">
                    <div className='info-title'>{t("MarkInfoTitle")}</div>
                    <div className='info-text'>
                        <div className='info-star'>*</div>
                        {t("MarkInfo1")}
                    </div>
                    <div className='info-text'>
                        <div className='info-star'>*</div>
                        {t("MarkInfo2")}
                    </div>
                    <div className='info-text'>
                        <div className='info-star'>*</div>
                        {t("MarkInfo3")}
                    </div>
                    <div className='info-text'>
                        <div className='info-star'>*</div>
                        {t("MarkInfo4")}
                    </div>
                    <div className='info-text'>
                        <div className='info-star'>*</div>
                        {t("MarkInfo5")}
                    </div>
                </div>
                <div className="mark-input-wrap">
                    <h3 className='mark-name'>{t("Mark")}</h3>
                    <div className='token-number-box'>
                        <h4 className='token-number-name'>
                            {t("Token Amount")}
                        </h4>
                        <div className="token-number-wrap">
                            <svg className='left-arrow' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M9.525 18.025q-.5.325-1.012.038T8 17.175V6.825q0-.6.513-.888t1.012.038l8.15 5.175q.45.3.45.85t-.45.85l-8.15 5.175Z" /></svg>
                            <div className="number-wrap">
                                <input
                                    className='token-number'
                                    type="text"
                                    onKeyPress={(event) => {
                                        if (!/[0-9]/.test(event.key)) {
                                            event.preventDefault();
                                        }
                                    }}
                                    value={tokenNumber}
                                    onChange={(e) => setTokenNumber(e.target.value)} />
                            </div>
                            <svg className='right-arrow' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M9.525 18.025q-.5.325-1.012.038T8 17.175V6.825q0-.6.513-.888t1.012.038l8.15 5.175q.45.3.45.85t-.45.85l-8.15 5.175Z" /></svg>
                        </div>
                        <div className="token-balance-wrap">
                            <div className="token-balance">
                                <div className="balance-name">
                                    {t("Balance")}
                                </div>
                                <div className="balance-number" >{balance}</div>
                            </div>
                        </div>
                    </div>
                    <div className='time-box'>
                        <h4 className='time-name'>
                            {t("Stake Duration")}
                        </h4>
                        <div className="time">
                            <svg className='left-arrow' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M9.525 18.025q-.5.325-1.012.038T8 17.175V6.825q0-.6.513-.888t1.012.038l8.15 5.175q.45.3.45.85t-.45.85l-8.15 5.175Z" /></svg>
                            <div className="time-day" onClick={() => setTime("0")}>{t("3 days")}</div>
                            <svg className='right-arrow' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M9.525 18.025q-.5.325-1.012.038T8 17.175V6.825q0-.6.513-.888t1.012.038l8.15 5.175q.45.3.45.85t-.45.85l-8.15 5.175Z" /></svg>
                        </div>
                    </div>
                </div>
            </div>
            <div className={i18n.language === 'en' ? 'result-wrap' : 'zh-result-wrap'}>
                <svg className="alert-logo" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 22 22"><path fill="#ffffff" d="M12 12h-2V6h2Zm0 4h-2v-2h2Zm0 5h-2v-1H9v-1H8v-1H7v-1H6v-1H5v-1H4v-1H3v-1H2v-1H1v-2h1V9h1V8h1V7h1V6h1V5h1V4h1V3h1V2h1V1h2v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v2h-1v1h-1v1h-1v1h-1v1h-1v1h-1v1h-1v1h-1v1h-1Zm0-3v-1h1v-1h1v-1h1v-1h1v-1h1v-1h1v-2h-1V9h-1V8h-1V7h-1V6h-1V5h-1V4h-2v1H9v1H8v1H7v1H6v1H5v1H4v2h1v1h1v1h1v1h1v1h1v1h1v1Z" /></svg>
                {t("SiteMarkedAs")}&nbsp;
                <div className="result">{t("Risky")}</div>
            </div>
            <div className="mark-button-wrap">
                <div
                    className='mark-bad-button'
                    onClick={() => handleSubmit(badType, tokenNumber, selectedTime)}
                >
                    <h2 className={i18n.language === 'en' ? 'mark-bad-text' : 'zh-mark-bad-text'}>{t("Stake as Risky")}</h2>
                </div>
                <div
                    className='mark-safe-button'
                    onClick={() => handleSubmit(safeType, tokenNumber, selectedTime)}
                >
                    <h2 className={i18n.language === 'en' ? 'mark-safe-text' : 'zh-mark-safe-text'}>{t("Stake as Safe")}</h2>
                </div>
            </div>
        </>
    );
};

export default MarkCard;
