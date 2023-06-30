import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import Connect from "../../components/Connect"
import faucetContractData from "../../abi/faucet_abi"
import "./faucet.css"
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

const { faucetContractABI, faucetContractAddress } = faucetContractData
const Faucet = () => {
    const [faucetAddress, setFaucetAddress] = React.useState('');
    const { t, i18n } = useTranslation();
    const [provider, setProvider] = React.useState(null);
    // 回调函数
    const handleProviderUpdate = (newProvider) => {
        setProvider(newProvider);
    };

    // 处理点击事件
    const handleSubmit = async () => {
        if (faucetAddress == "") {
            toast.warn(t("null address"))
            return
        }
        console.log("faucetAddress:", faucetAddress);
        // 1. 连接到智能合约
        if (provider) {
            const web3Instance = new Web3(provider);
            // 与智能合约交互
            await requestTokens(web3Instance);
        } else {
            toast.warn(t("connect first"))
        }
    };

    // 获取token
    async function requestTokens(web3) {
        // 从钱包获取当前地址
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];
        console.log(account)
        //faucet
        const faucetContract = new web3.eth.Contract(faucetContractABI, faucetContractAddress);
        try {
            const lastAccessTime = await faucetContract.methods.lastAccessTime(faucetAddress).call();
            const currentTime = Math.floor(Date.now() / 1000);
            if (currentTime - lastAccessTime < 24 * 60 * 60) {
                console.log(t("already claim"));
                // 你可以在这里添加其他的逻辑，例如在用户界面上显示一条消息
                toast.warn(t("already claim"))
                return
            }
            await faucetContract.methods.requestTokens(faucetAddress).send({ from: account });
            toast.success(t("successfully claim"))
        } catch (error) {
            console.error(error);
            toast.error(error)
        }

    }
    return (
        <div className='page'>
            <Connect onProviderUpdate={handleProviderUpdate} />
            <div className='faucet-center'>
                <div className='symbol'>
                    +++### &nbsp;{t("Tips")} &nbsp;###+++<br/>
                    <br/>
                    &nbsp;$$$$$$$$$$$$$$$$$$$&nbsp;<br/>
                    $$$ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; $$$<br/>
                    $$$ &nbsp;100 {t("BAT/day")} &nbsp;$$$<br/>
                    $$$ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; $$$<br/>
                    &nbsp;$$$$$$$$$$$$$$$$$$$&nbsp;<br/>
                    <br/>
                </div>
                <div className='faucet-info'>
                    {t("Scroll Faucet")}
                </div>
                <div className='faucet-row'>
                    <svg className='left-arrow' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M9.525 18.025q-.5.325-1.012.038T8 17.175V6.825q0-.6.513-.888t1.012.038l8.15 5.175q.45.3.45.85t-.45.85l-8.15 5.175Z" /></svg>
                    <div className='input-frame'>
                        <input
                            className="input-address"
                            type="text"
                            value={faucetAddress}
                            onChange={(event) => setFaucetAddress(event.target.value)}
                            placeholder={t("Enter Address")}
                        />
                    </div>
                    <svg className='right-arrow' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M9.525 18.025q-.5.325-1.012.038T8 17.175V6.825q0-.6.513-.888t1.012.038l8.15 5.175q.45.3.45.85t-.45.85l-8.15 5.175Z" /></svg>
                    <div className='faucet-button' onClick={() => handleSubmit()}>
                        <h2 className={i18n.language === 'en' ? 'faucet-text' : 'zh-faucet-text'}>{t("Send BAT")}</h2>
                    </div>
                </div>
            </div>
            <div className='op-area'>
            </div>
        </div>
    )
}

export default Faucet