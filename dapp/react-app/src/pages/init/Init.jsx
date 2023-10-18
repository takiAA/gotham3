import React from 'react'
import "./init.css"
import Web3 from 'web3';
import { useTranslation } from 'react-i18next';
import Connect from "../../components/Connect"
import poolContractData from "../../abi/pool_abi"
import stakeContractData from "../../abi/stake_abi"
import tokenContractData from "../../abi/token_abi"
import axios from 'axios';
import { API_URLS } from "../../../config/apiUrl";
const { erc20ABI, erc20Address } = tokenContractData
import { toast } from 'react-toastify';

const { poolContractABI } = poolContractData
const { stakeContractABI, stakeContractAddress } = stakeContractData

import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: 'transparent',
    color: '#FFFFFF',
    border: '0.3vw dashed #65C999',
    fontFamily: '--pro-font',
    fontWeight: '600',
    fontSize: '1vw',
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: '0.8vw',
    backgroundColor: 'transparent',
    color: '#FFFFFF',
    border: '0.3vw dashed #65C999',
    fontFamily: '--pro-font',
    fontWeight: '600',
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  '&:last-child td, &:last-child th': {

  },
}));

// function createData(url, bad, safe, time, token) {
//   return { url, bad, safe, time, token };
// }

const Init = () => {
  const [rows, setRows] = React.useState([]);
  const [url, setUrl] = React.useState('');
  const [badTokens, setBadTokens] = React.useState(0);
  const [safeTokens, setSafeTokens] = React.useState(0);
  const [selectedDirection, setDirection] = React.useState('false');
  const { t, i18n } = useTranslation();
  const [provider, setProvider] = React.useState(null);
  const [arbitrationTokens, setArbitrationTokens] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [typeSelect, setTypeSelect] = React.useState('Website');

  // 控制表格页面
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  const setLeftPage = () => {
    var nowPage = page;
    if (nowPage > 0)
      setPage(nowPage - 1);
  }
  const setRightPage = () => {
    var nowPage = page;
    if (rows.length > rowsPerPage * nowPage + rowsPerPage)
      setPage(nowPage + 1);
  }
  // 回调函数
  const handleProviderUpdate = (newProvider) => {
    console.log("handleProviderUpdate called with ", newProvider);
    setProvider(newProvider);
  };
  // 筛选未仲裁的
  async function createData(url, bad, safe, time) {
    let address = ""
    let isInArbitration = false
    let tokenForArbitration = 0
    if (provider) {
      const web3 = new Web3(provider);
      // 与智能合约交互
      const contract = new web3.eth.Contract(stakeContractABI, stakeContractAddress);

      // 从钱包获取当前地址
      const accounts = await web3.eth.getAccounts();
      const currentAccount = accounts[0];
      // 当前用户
      console.log(currentAccount)
      try {
        console.log(url)
        const poolAddress = await contract.methods.getStakingContract(url, 0).call();
        console.log("Pool address:", poolAddress);
        address = poolAddress
        if (poolAddress == '0x0000000000000000000000000000000000000000') {
          //toast.warn("There are no stakes on this pool.");
          return { url, bad, safe, time, isInArbitration, tokenForArbitration }
        }
        const poolContract = new web3.eth.Contract(poolContractABI, poolAddress);
        const poolInfo = await poolContract.methods.getAllStateVariables().call();
        isInArbitration = poolInfo[6]
        if (isInArbitration) {
          return { url, bad, safe, time, isInArbitration, tokenForArbitration }
        }
        // totalDownStake: web3.utils.fromWei(poolInfo[0], 'ether'),
        // 	totalUpStake: web3.utils.fromWei(poolInfo[1], 'ether'),
        // 	upLossPool: web3.utils.fromWei(poolInfo[2], 'ether'),
        // 	downLossPool: web3.utils.fromWei(poolInfo[3], 'ether'),
        // 	endTimeOfArbitration: poolInfo[4],
        // 	expirationTimestamp: poolInfo[5],
        let now = Date.parse(new Date()) / 1000
        let upVote = parseFloat(web3.utils.fromWei(poolInfo[1], 'ether')) + parseFloat(web3.utils.fromWei(poolInfo[2], 'ether'))
        let downVote = parseFloat(web3.utils.fromWei(poolInfo[0], 'ether')) + parseFloat(web3.utils.fromWei(poolInfo[3], 'ether'))
        let timestamp = poolInfo[4]
        tokenForArbitration = (upVote + downVote) / 2
        bad = downVote
        safe = upVote
        time = parseInt(timestamp) - now
        //return { url, bad, safe, time };
      } catch (error) {
        console.error('合约函数调用失败', error);

      }
    } else {
      console.log("请先连接钱包")
    }
    return { url, bad, safe, time, address, isInArbitration, tokenForArbitration };
  }
  // 改变数据查询类型
  function changeType(type) {
    setTypeSelect(type);
  }
  // 发起仲裁
  const handleInitiateArbitration = async () => {
    console.log(`获取到的url为:${url}`)
    // 在此处调用智能合约并更新状态
    if (provider) {
      const web3Instance = new Web3(provider);
      // 与智能合约交互
      await initiateArbitration(web3Instance, url);
    } else {
      console.log("请先连接钱包")
    }
    // 例如：
    // const newStakersCount = await contract.getStakersCount();
    // setStakersCount(newStakersCount);

    // 根据你的智能合约方法来调用并更新其他状态
  };
  // 按钮触发
  const setHandleInitiateArbitration = async (direction) => {
    setDirection(direction);
    handleInitiateArbitration();
  };
  function dataFilter(data, type) {
    let res = data;
    switch(type) {
      case 'Website':
        res = data.filter(item => !item.url.endsWith('.eth') && !item.url.startsWith('@'));
        break;
      case 'Twitter':
        res = data.filter(item => item.url.startsWith('@'));
        break;
      case 'ENS':
        res = data.filter(item => item.url.endsWith('.eth'));
        break;
    }

    return res;
  }
  // 获取未仲裁url信息
  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_URLS.getBannedUrlList}`);
      let data = response.data;
      data = dataFilter(data.data, typeSelect);
      console.log(data);

      // 使用 Promise.all 来处理异步 createData 函数
      const dataPromises = data.map((item, index) => createData(item.url, item.downvotes, item.upvotes, '1 days', item.score));

      const resolvedData = await Promise.all(dataPromises);

      const filteredData = resolvedData.filter(row => !row.isInArbitration && row.tokenForArbitration > 0);
      setRows(filteredData);

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  React.useEffect(() => {
    const currentUrl = getQueryStringParameters();
    if (currentUrl.attachUrl) {
      setUrl(currentUrl.attachUrl);
    }
    fetchData();
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
    const timer = setInterval(() => {
      fetchContractData();
    }, 5000);
    const counter = setInterval(() => {
      setRows(rows => rows.map(row => ({
        ...row,
        time: Math.max(0, row.time - 1)
      })));
    }, 1000);
    return () => {
      clearInterval(counter);
      clearInterval(timer);
    }
  }, [url, provider,typeSelect]);
  // 定时器解析
  function formatTime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds -= days * 24 * 60 * 60;
    const hrs = Math.floor(seconds / (60 * 60));
    seconds -= hrs * 60 * 60;
    const mnts = Math.floor(seconds / 60);
    seconds -= mnts * 60;
    // 根据当前语言环境选择天和小时的文本替换
    const dayText = t('dayText');
    const hourText = t('hourText');
    const minuteText = t('minuteText');
    const secondText = t('secondText');
    return `${days}${dayText} ${hrs}${hourText} ${mnts}${minuteText} ${seconds}${secondText}`;
  }


  // 获取当前url到query
  function getQueryStringParameters() {
    const queryString = window.location.search.substring(1);
    console.log(queryString)
    const queryParams = {};
    const pairs = queryString.split("&");

    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i].split("=");
      queryParams[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
    console.log(queryParams)
    return queryParams;
  }
  // 发起仲裁
  const initiateArbitration = async (web3, url) => {
    const contract = new web3.eth.Contract(stakeContractABI, stakeContractAddress);

    // 从钱包获取当前地址
    const accounts = await web3.eth.getAccounts();
    const currentAccount = accounts[0];
    // 当前用户
    console.log(currentAccount)
    try {
      if(typeSelect=="Website"){
        url = getTopLevelDomain(url)
      }
      
      console.log(url)
      const poolAddress = await contract.methods.getStakingContract(url, 0).call();
      console.log("Pool address:", poolAddress);
      if (poolAddress == '0x0000000000000000000000000000000000000000') {
        toast.warn("There are no stakes on this pool.");
        return
      }
      const poolContract = new web3.eth.Contract(poolContractABI, poolAddress);
      let isInArbitration = await poolContract.methods.isInArbitration().call()
      if (isInArbitration) {
        toast.warn("Arbitration has been initiated");
        return
      }
      let initiationAmount = await poolContract.methods.calcInitiateAmount().call()
      const erc20Contract = new web3.eth.Contract(erc20ABI, erc20Address);
      let allowanceAmount = await erc20Contract.methods.allowance(currentAccount, stakeContractAddress).call({ from: currentAccount })
      if (allowanceAmount < initiationAmount) {
        await erc20Contract.methods.approve(stakeContractAddress, initiationAmount).send({ from: currentAccount });
      }
      await contract.methods.initiateArbitrationOnContract(url, 0, selectedDirection).send({ from: currentAccount })
      toast.success("initiate Arbitration successfully")

    } catch (error) {
      toast.error("contract call erro")
      console.error('合约函数调用失败', error);
    }
  }
  // 进行质押
  const getPoolDetail = async (web3, url) => {

    const contract = new web3.eth.Contract(stakeContractABI, stakeContractAddress);

    // 从钱包获取当前地址
    const accounts = await web3.eth.getAccounts();
    const currentAccount = accounts[0];
    if (currentAccount == null || currentAccount == undefined) {
      return
    }
    // 当前用户
    console.log(currentAccount)
    // 调用智能合约函数
    try {
      if(typeSelect=="Website"){
        url = getTopLevelDomain(url)
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
      const poolAddress = await contract.methods.getStakingContract(url, 0).call();
      console.log("Pool address:", poolAddress);
      if (poolAddress == '0x0000000000000000000000000000000000000000') {
        return;
      }
      const poolContract = new web3.eth.Contract(poolContractABI, poolAddress);
      const poolInfo = await poolContract.methods.getAllStateVariables().call();
      const rank = await poolContract.methods.rank().call();
      console.log(`${rank}`)

      upvotesBN = upvotesBN.add(web3.utils.toBN(poolInfo[1]))
      downvotesBN = downvotesBN.add(web3.utils.toBN(poolInfo[0]))
      websiteInfo.pool_trade_times += parseInt(rank);
      websiteInfo.upvotes = web3.utils.fromWei(upvotesBN, 'ether');
      websiteInfo.downvotes = web3.utils.fromWei(downvotesBN, 'ether');
      websiteInfo.score += Math.floor(Math.random() * (websiteInfo.upvotes - websiteInfo.downvotes)) + 1;
      console.log(websiteInfo);
      //setStakersCount(websiteInfo.pool_trade_times)
      setBadTokens(websiteInfo.downvotes)
      //setScore(websiteInfo.score)
      setSafeTokens(websiteInfo.upvotes)
      let initiationAmount = await poolContract.methods.calcInitiateAmount().call()
      setArbitrationTokens(web3.utils.fromWei(initiationAmount, 'ether'))
    } catch (error) {
      //alert("合约函数调用失败")
      console.error('合约函数调用失败', error);
    }
  }
  // 发起仲裁质押
  async function vote(url) {
    setUrl(url)
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
      console.log('Invalid URL:', error);
      return "";
    }
  }

  return (
    <div className='init-wrap'>
      <div className='page'>
        <Connect onProviderUpdate={handleProviderUpdate} />

        <div className='init-up'>
          <div className='target'>{t("Target")}</div>
          <div className='url'>
            <svg className='left-arrow' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M9.525 18.025q-.5.325-1.012.038T8 17.175V6.825q0-.6.513-.888t1.012.038l8.15 5.175q.45.3.45.85t-.45.85l-8.15 5.175Z" /></svg>
            <div className='url-wrap'>
              <input
                className="ftx-url"
                type="text"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://ftx.com"
              />
            </div>
            <svg className='right-arrow' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M9.525 18.025q-.5.325-1.012.038T8 17.175V6.825q0-.6.513-.888t1.012.038l8.15 5.175q.45.3.45.85t-.45.85l-8.15 5.175Z" /></svg>
            <div className='mark-select' tabindex="0">
                <div className='select-title'>
                  {/* 当前数据类型 */}
                  <div className='select-title-type'>{typeSelect}</div>
                  <svg className='up-arrow' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M9.525 18.025q-.5.325-1.012.038T8 17.175V6.825q0-.6.513-.888t1.012.038l8.15 5.175q.45.3.45.85t-.45.85l-8.15 5.175Z" /></svg>
                  <svg className='down-arrow' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M9.525 18.025q-.5.325-1.012.038T8 17.175V6.825q0-.6.513-.888t1.012.038l8.15 5.175q.45.3.45.85t-.45.85l-8.15 5.175Z" /></svg>
                </div>
                <div className='select-open'>
                  <div className='select-option option-1' onClick={() => changeType('Website')} >Website</div>
                  <div className='select-option option-2' onClick={() => changeType('Twitter')} >Twitter</div>
                  <div className='select-option option-3' onClick={() => changeType('ENS')} >ENS</div>
                </div>
              </div>
          </div>
          {/* <div className='init-choose'>
            <select
              className="rors" // risky or safe
              value={selectedDirection}
              onChange={(e) => SetDirection(e.target.value)}
            >
              <option value="false">{t("Risky")}</option>
              <option value="true">{t("Safe")}</option>
            </select>
          </div> */}
          {/* <div className='init-button' onClick={() => handleInitiateArbitration()}>
            {t("Initiate Arbitration")}
          </div> */}
        </div>

        <div className="init-data-wrap">
          <div className='init-data-left'>
            <div className='target-data'>Arbitration Data:</div>
            <div className='data-word'>
              <div className='flex-row'>
                <div className="data-name">{t("Arbitration Time")}</div>
                <div className="data-number">1 Days</div>
              </div>
            </div>
            <div className='data-word'>
              <div className='flex-row'>
                <div className="data-name">{t("Token for Arbitration")}</div>
                <div className="data-number">{arbitrationTokens}</div>
              </div>
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
          <div className='init-data-right'>
            <div className="mark-info">
              <div className='info-title'>{t("ArbiInfoTitle")}</div>
              <div className='info-text'>
                <div className='info-star'>*</div>
                {t("ArbiInfo1")}
              </div>
              <div className='info-text'>
                <div className='info-star'>*</div>
                {t("ArbiInfo2")}
              </div>
              <div className='info-text'>
                <div className='info-star'>*</div>
                {t("ArbiInfo3")}
              </div>
              <div className='info-text'>
                <div className='info-star'>*</div>
                {t("ArbiInfo4")}
              </div>
            </div>
          </div>
        </div>
        
        {/* <div className='show-table-button'>Show</div> */}

        <div className='init-table'>
          <TableContainer component={Paper} style={{ maxWidth: '68vw', maxHeight: "50vh", overflow: 'auto', backgroundColor: 'transparent' }}>
            <Table sx={{ minWidth: '10vw' }} size="small" aria-label="a-dense-table">
              <TableHead>
                <TableRow>
                  <StyledTableCell>{t("Top Domain")}</StyledTableCell>
                  <StyledTableCell align="left">{t('Risky Stake')}</StyledTableCell>
                  <StyledTableCell align="left">{t('Safe Stake')}</StyledTableCell>
                  <StyledTableCell align="left">{t('Remaining Time')}</StyledTableCell>
                  <StyledTableCell align="left">{t('Token for Arbitration')}</StyledTableCell>
                  <StyledTableCell align="center">{t("Operation")}</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                  <StyledTableRow
                    key={row.no}
                    sx={{}}
                  >
                    <StyledTableCell component="th" scope="row">
                      {row.url}
                    </StyledTableCell>
                    <StyledTableCell align="left">{row.bad}</StyledTableCell>
                    <StyledTableCell align="left">{row.safe}</StyledTableCell>
                    <StyledTableCell align="left">{formatTime(row.time)}</StyledTableCell>
                    <StyledTableCell align="left">{row.tokenForArbitration}</StyledTableCell>
                    <StyledTableCell align="center">
                      <div className='join-button' onClick={() => vote(row.url)}>
                        {t("Switch")}
                      </div>
                    </StyledTableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={rows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            sx={{
              display: 'none',
            }}
          />
        </div>
      </div>

      <div className='op-area'>
        <div className='pageCount'>
          <div className='pageCountText'>
            [{page * rowsPerPage + 1} - {page * rowsPerPage + rowsPerPage}]
          </div>
          <div className='pageCountText'>
            / {rows.length}
          </div>
        </div>
        <div className='pageButton'>
          <div className='leftPage'>
            <svg className='bottomLeft' xmlns="http://www.w3.org/2000/svg" width="5vw" height="5vw" viewBox="0 0 24 24"><path fill="#bfbfbf" d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z" /></svg>
            <svg className='highLightLeft' xmlns="http://www.w3.org/2000/svg" width="3.5vw" height="3.5vw" viewBox="0 0 24 24"><path fill="#ffffff" d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z" /></svg>
            <svg className='topLeft' onClick={setLeftPage} xmlns="http://www.w3.org/2000/svg" width="2.6vw" height="2.6vw" viewBox="0 0 24 24"><path fill="#65C999" d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z" /></svg>
          </div>
          <div className='rightPage'>
            <svg className='bottomLeft' xmlns="http://www.w3.org/2000/svg" width="5vw" height="5vw" viewBox="0 0 24 24"><path fill="#bfbfbf" d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z" /></svg>
            <svg className='highLightLeft' xmlns="http://www.w3.org/2000/svg" width="3.5vw" height="3.5vw" viewBox="0 0 24 24"><path fill="#ffffff" d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z" /></svg>
            <svg className='topLeft' onClick={setRightPage} xmlns="http://www.w3.org/2000/svg" width="2.6vw" height="2.6vw" viewBox="0 0 24 24"><path fill="#65C999" d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z" /></svg>
          </div>
        </div>
        <div className="mark-button-wrap">
          <div
            className='mark-bad-button'
            onClick={() => setHandleInitiateArbitration('false')}
          >
            <h2 className={i18n.language === 'en' ? 'mark-bad-text' : 'zh-mark-bad-text'}>{t("Stake as Risky")}</h2>
          </div>
          <div
            className='mark-safe-button'
            onClick={() => setHandleInitiateArbitration('true')}
          >
            <h2 className={i18n.language === 'en' ? 'mark-safe-text' : 'zh-mark-safe-text'}>{t("Stake as Safe")}</h2>
          </div>
        </div>
      </div>
    </div >
  )
}

export default Init