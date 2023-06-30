import React from 'react';
import Web3 from 'web3';
import './App.css'
import SBT from './assets/sbt.png'
import Connect from "./components/Connect"
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SBTcontractData from "./abi/sbt_abi"

const { SBTcontractABI, SBTcontractAddress } = SBTcontractData

function App() {
  const [str, setStr] = React.useState('');
  const [provider, setProvider] = React.useState(null);
  // 回调函数
  const handleProviderUpdate = (newProvider) => {
    setProvider(newProvider);
  };
  const handleMintButtonClick = async () => {
    if (provider) {
      // 输入检查
      if (str.length == 0) {
        toast.error("Invalid input. input can't empty");
        return;
      }
      if (str.length > 15 || !/^[a-zA-Z0-9]+$/.test(str)) {
        // 检查未通过，给出相应提示
        toast.error("Invalid input. String length should be less than 10 and can only contain letters and numbers.");
        return;
      }
      const web3Instance = new Web3(provider);
      // 从钱包获取当前地址
      const accounts = await web3Instance.eth.getAccounts();
      const currentAccount = accounts[0];
      // 构建 API URL
      const apiUrl = "https://www.gotham3.io/api/v1/mintNFT";
      const queryString = `?str=${encodeURIComponent(str)}&address=${encodeURIComponent(currentAccount)}`;
      const url = apiUrl + queryString;
      const loadingToastId = toast.loading("NFT minting in progress...")
      fetch(url)
        .then(response => {
          if (response.ok) {
            // 请求成功，进行下一步操作
            // ...
            toast.dismiss(loadingToastId)
            return response.json();
          } else {
            // 请求失败，处理错误
            console.log(response)
            return response.json();
          }
        })
        .then(async data => {
          // 处理解析后的数据
          if (data.message === 'NFT minted successfully') {
             // 输出 "NFT generate successfully"
            toast.success(data.str)
            console.log(data.str); // 输出 str 的值
            const contract = new web3Instance.eth.Contract(SBTcontractABI, SBTcontractAddress);
            // 调用智能合约函数
            try {
              await contract.methods.mintNFT(data.str).send({ from: currentAccount });
              toast.success(data.message);
            } catch (error) {
              toast.error("Contract call failed.")
              console.error('合约函数调用失败', error);
            }
          } else {
            toast.dismiss(loadingToastId)
            toast.error(data.message)
          }
        })
        .catch(error => {
          // 处理错误
          toast.dismiss(loadingToastId)
          console.error(error);
          toast.error(error);
        });
    } else {
      toast.warn("Please connect your wallet first.")
    }
  };

  return (
    <>
      <div className='container'>
        <ToastContainer
          position="top-center"
          autoClose={4000}
          limit={3}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark" />
        <Connect onProviderUpdate={handleProviderUpdate} />
        <div className='center'>
          <img src={SBT} className="sbt-pic"></img>
          <div className='input-str'>
            <input className="sign-str"
              type="text"
              value={str}
              onChange={(event) => setStr(event.target.value)}
              placeholder="Input string as watermark"
            />
          </div>
          <div className='mint-button' onClick={handleMintButtonClick}>
            MINT
          </div>
        </div>
        <div className='back'>
          <div className='gotham3'>G<br />O<br />T<br />H<br />A<br />M<br />3</div>
          <div className='sbt'>SBT</div>
        </div>
      </div>
    </>
  )
}

export default App
