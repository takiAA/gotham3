import React from 'react'
import "./connect.css"
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import detectEthereumProvider from '@metamask/detect-provider';

const targetChainId = "0x82751" //scroll 链id
var isDisconnect = false;

const Connect = ({ onProviderUpdate }) => {
  const [address, setAddress] = React.useState(null);
  const [provider, setProvider] = React.useState(null);
  const { t, i18n } = useTranslation();
  const CHAIN_ID = '534353';


  React.useEffect(() => {
    const detectProvider = async () => {
      const ethereumProvider = await detectEthereumProvider();
      console.log("请求ethereumProvider:" + ethereumProvider)

      if (!ethereumProvider) {
        //toast.error(t('no metamask'));
        console.error('No Ethereum provider detected');
        return;
      }
      setProvider(ethereumProvider);
      // 检查链ID是否为指定的链ID
      const chainId = await ethereumProvider.request({ method: 'eth_chainId' });

      console.log("useEffect")
      if (isDisconnect) {
        return;
      }
      if (!checkChainId(chainId, false)) {
        return
      }
      setProvider(ethereumProvider);
      onProviderUpdate(ethereumProvider)
      const accounts = ethereumProvider.selectedAddress

      setAddress(accounts)

      // Listen for accountsChanged
      ethereumProvider.on('accountsChanged', function (accounts) {
        if (accounts.length === 0) {
          console.log('Please connect to MetaMask.');
        } else if (accounts[0] !== address) {
          setAddress(accounts[0]);
          onProviderUpdate(null)
        }
      });

      ethereumProvider.on('chainChanged', () => {
        setAddress(null)
        onProviderUpdate(null)
        console.log("chainChanged")
        //toast.warn("this DApp only supports the Scroll Testnet.")
      });

      return () => {
        ethereumProvider.off('accountsChanged');
        ethereumProvider.off('chainChanged');
      };
    };
    detectProvider();
  }, [address]);

  const switchNetwork = async () => {
    try {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: targetChainId,
          chainName: 'Scroll Alpha Testnet',
          nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: ['https://alpha-rpc.scroll.io/l2'],  // 你的 RPC URL
          blockExplorerUrls: ['https://blockscout.scroll.io'],  // 你的区块链浏览器 URL
        }],
      });
      const chainId = await provider.request({ method: 'eth_chainId' });
      return checkChainId(chainId, false)
    } catch (switchError) {
      console.log(switchError)
      // handle "addEthereumChain" error
      return false
    }
  };

  const connectMetamask = React.useCallback(async () => {
    if (!provider) {
      toast.warn(t("no metamask"));
      console.error('No Ethereum provider detected');
      return;
    }

    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' });

      // 检查链ID是否为指定的链ID
      const chainId = await provider.request({ method: 'eth_chainId' });
      if (!checkChainId(chainId, true)) {
        let success = await switchNetwork();
        if (!success) {
          return
        }
      }
      setAddress(accounts[0]);
      isDisconnect = false;
    } catch (error) {
      console.error('用户拒绝了请求');
    }
  }, [provider]);

  function checkChainId(chainId, toWarn) {
    if (parseInt(chainId, 16) != parseInt(CHAIN_ID)) {
      if (toWarn) {
        toast.warn(t("Gotham3 only supports the Scroll Testnet."));
      }
      console.error('Connected to the wrong network');
      return false;
    }
    return true
  }

  const disconnectMetamask = async () => {
    setAddress(null);
    onProviderUpdate(null);
    isDisconnect = true
    // Notify MetaMask to open the UI and ask the user to manually disconnect.
    // try {
    //   if (provider) {
    //     await provider.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] });
    //   }
    // } catch (error) {
    //   console.error('Failed to open MetaMask UI');
    // }
  };

  return (
    <div>
      {address ? (
        <div className={i18n.language === 'en' ? 'par' : 'zh-par'}>
          <div className="connected" onClick={disconnectMetamask}>
            {address.slice(0, 6)}...{address.slice(38, 42)}
            <div className='disconnect'>{t("Disconnect")}</div>
          </div>
        </div>
      )
        : (
          <div className={i18n.language === 'en' ? 'connect-button' : 'zh-connect-button'} onClick={connectMetamask}>
            {t("Connect")}
          </div>
        )}
    </div>
  )
}

export default Connect