import React from 'react'
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';
import Connect from "../../components/Connect"
import poolContractData from "../../abi/pool_abi"
import stakeContractData from "../../abi/stake_abi"
import { API_URLS } from "../../../config/apiUrl";
import "./arbi.css"
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Web3 from 'web3';
import { toast } from 'react-toastify';

const { poolContractABI } = poolContractData
const { stakeContractABI, stakeContractAddress } = stakeContractData



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




const Arbi = () => {
  const [rows, setRows] = React.useState([]);
  const { t } = useTranslation();
  const [provider, setProvider] = React.useState(null);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

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

  async function vote(url, poolAddress, isUp) {
    if (provider) {
      const web3 = new Web3(provider);
      // 与智能合约交互

      // 从钱包获取当前地址
      const accounts = await web3.eth.getAccounts();
      const currentAccount = accounts[0];
      // 当前用户
      console.log(currentAccount)
      const contract = new web3.eth.Contract(stakeContractABI, stakeContractAddress);
      await contract.methods.voteOnContract(url, 0, isUp).send({ from: currentAccount })
    }
  }

  async function createData(url, bad, safe, time) {
    let address = ""
    let isInArbitration = false
    let isVote = false
    let ArbitratioTimes = 0
    if (provider) {
      const web3 = new Web3(provider);
      // 与智能合约交互
      const contract = new web3.eth.Contract(stakeContractABI, stakeContractAddress);

      // 从钱包获取当前地址
      const accounts = await web3.eth.getAccounts();
      const currentAccount = accounts[0];
      if (currentAccount == null || currentAccount == undefined) {
        return
      }
      // 当前用户
      console.log(currentAccount)
      try {
        console.log(url)
        const poolAddress = await contract.methods.getStakingContract(url, 0).call();
        console.log("Pool address:", poolAddress);
        address = poolAddress
        if (poolAddress == '0x0000000000000000000000000000000000000000') {
          //toast.warn("There are no stakes on this pool.");
          return { url, bad, safe, time, isInArbitration }
        }
        const poolContract = new web3.eth.Contract(poolContractABI, poolAddress);
        isInArbitration = await poolContract.methods.isInArbitration().call()
        if (!isInArbitration) {
          return { url, bad, safe, time, isInArbitration }
        }
        const now = Date.parse(new Date()) / 1000
        const upVote = await poolContract.methods.upVote().call()
        const downVote = await poolContract.methods.downVote().call()
        const timestamp = await poolContract.methods.endTimeOfArbitration().call()
        const voteInfo = await poolContract.methods.voteInfos(currentAccount).call()
        isVote = voteInfo.isVoted
        console.log(isVote)
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
    return { url, bad, safe, time, address, isInArbitration, isVote, ArbitratioTimes };
  }
  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_URLS.getBannedUrlList}`);
      const data = response.data;
      console.log(data);

      // 使用 Promise.all 来处理异步 createData 函数
      const dataPromises = data.data.map((item, index) => createData(item.url, item.downvotes, item.upvotes, '1 days', item.score));

      const resolvedData = await Promise.all(dataPromises);
      const filteredData = resolvedData.filter(row => row.isInArbitration);
      // const ArbitrationEvents = await poolContract.getPastEvents('DeterminedArbitration', {
      //   fromBlock: 2785895,
      //   toBlock: 'latest',
      // });
      // ArbitratioTimes=ArbitrationEvents.length
      // 先根据 time 降序排序，再根据 url 升序排序
      filteredData.sort((a, b) => {
        // 如果 time 不相等，则按照 time 升序排序
        if (a.time !== b.time) {
          return a.time - b.time;
        }

        // 如果 score 相等，则按照 name 升序排序
        return a.url.localeCompare(b.url);
      });
      setRows(filteredData);

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
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
    //return `${days}天${hrs}小时${mnts}分钟${seconds}秒`;
  }

  // 每50秒钟请求一次数据
  React.useEffect(() => {
    fetchData();
    const timer = setInterval(() => {
      fetchData();
    }, 50000);
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
  }, [provider]);

  return (
    <div className='page'>
      <Connect onProviderUpdate={handleProviderUpdate} />
      <h2 className='arbi-title'>{t("Arbitration List")}</h2>
      <div className='table'>
        <TableContainer component={Paper} style={{ maxWidth: '64vw', maxHeight: "52vh", overflow: 'auto', backgroundColor: 'transparent' }}>
          <Table sx={{ minWidth: 100 }} size="small" aria-label="a-dense-table">
            <TableHead>
              <TableRow>
                <StyledTableCell>{t("URL in Arbitration")}</StyledTableCell>
                <StyledTableCell align="left">{t("Risky Arbi Stake")}</StyledTableCell>
                <StyledTableCell align="left">{t("Safe Arbi Stake")}</StyledTableCell>
                <StyledTableCell align="left">{t("Remaining Time")}</StyledTableCell>
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
                  <StyledTableCell align="center">
                    <div className='op'>
                      <div className={`arbi-downvote-button ${row.isVote ? 'disabled' : ''}`} onClick={row.isVote ? null : () => vote(row.url, row.address, false)}>
                        {t("downvote")}
                      </div>
                      <div className={`arbi-upvote-button ${row.isVote ? 'disabled' : ''}`} onClick={row.isVote ? null : () => vote(row.url, row.address, true)}>
                        {t("upvote")}
                      </div>
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
      </div>
    </div>
  )
}

export default Arbi