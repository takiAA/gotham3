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
// ... 其他引入
import axios from 'axios';

import "./rank.css"
import Connect from "../../components/Connect"
import { API_URLS } from "../../../config/apiUrl";
import { useTranslation } from 'react-i18next';
import stakeContractData from "../../abi/stake_abi"
import poolContractData from "../../abi/pool_abi"
import Web3 from 'web3';
import { tablePaginationClasses } from '@mui/base';

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

const Rank = () => {
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

  async function createData(no, name, bad, safe, rate, score) {
    let isInArbitration = false
    if (provider) {
      const web3 = new Web3(provider);
      // 与智能合约交互
      const contract = new web3.eth.Contract(stakeContractABI, stakeContractAddress);

      // 从钱包获取当前地址
      const accounts = await web3.eth.getAccounts();
      const currentAccount = accounts[0];
      try {
        let urlPoolAddress = await contract.methods.getStakingContract(name, 0).call({ from: currentAccount });
        console.log(`getStakingContract:${urlPoolAddress}`)
        if (urlPoolAddress != "0x0000000000000000000000000000000000000000") {
          const poolContract = new web3.eth.Contract(poolContractABI, urlPoolAddress);
          isInArbitration = await poolContract.methods.isInArbitration().call()
        }
      } catch (error) {
        console.error(t("function fail"), error);
      }
    }
    return { no, name, bad, safe, rate, score, isInArbitration };
  }
  // 回调函数
  const handleProviderUpdate = (newProvider) => {
    console.log("handleProviderUpdate called with ", newProvider);
    setProvider(newProvider);
  };
  // 异步获取数据
  // 修改fetchData函数，使其能够使用你的智能合约
  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_URLS.getBannedUrlList}`);
      const data = response.data;
      console.log(data)
      if (provider) {
        // 如果你的provider是在fetchData函数内部创建的，你可以在这里创建它
        const web3 = new Web3(provider);
        const contract = new web3.eth.Contract(stakeContractABI, stakeContractAddress);
        // 如果你的provider是在fetchData函数外部创建的，你应该把它作为一个参数传入fetchData函数
        const accounts = await web3.eth.getAccounts();
        const currentAccount = accounts[0];
        if (currentAccount == null || currentAccount == undefined) {
          return
        }
        const promises = data.data.map((item, index) => createData(
          index + 1,
          item.url,
          item.downvotes,
          item.upvotes,
          '10%',
          item.score,
          contract,
          web3
        ));

        const rows = await Promise.all(promises);
        // 先根据 score 降序排序，再根据 name 升序排序
        rows.sort((a, b) => {
          // 如果 score 不相等，则按照 score 降序排序
          if (a.score !== b.score) {
            return b.score - a.score;
          }
          // 如果 score 相等，则按照 name 升序排序
          return a.name.localeCompare(b.name);
        });
        setRows(rows);
      }
    }
    catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  // const fetchData = async () => {
  //   try {
  //     const response = await axios.get(`${API_URLS.getBannedUrlList}`);
  //     const data = response.data;
  //     console.log(data)
  //     setRows(data.data.map((item, index) => createData(index + 1, item.url, item.downvotes, item.upvotes, '10%', item.score)));
  //   } catch (error) {
  //     console.error('Error fetching data:', error);
  //   }
  // };


  // 每分钟请求一次数据
  React.useEffect(() => {
    fetchData();
    const timer = setInterval(() => {
      fetchData();
    }, 60000);

    return () => clearInterval(timer);
  }, [provider]);


  async function markEvent(url) {
    const origin = window.location.origin;  // 获取当前URL的域名
    const targetUrl = `${origin}/alpha/?attachUrl=${encodeURIComponent(url)}`;
    //window.open(targetUrl, "_blank"); // 在新窗口中打开URL
    // 或者，希望在当前窗口中打开URL，你可以使用：
    window.location.href = targetUrl;
  }

  return (
    <div className='page'>
      <Connect onProviderUpdate={handleProviderUpdate} />
      <div className='rank-center'>
        <h2 className='rank-title'>{t("Risk Website Ranking")}</h2>
        <div className='table'>
          <TableContainer component={Paper} style={{ maxWidth: '64vw', maxHeight: "50vh", overflow: 'auto', backgroundColor: 'transparent' }}>
            <Table sx={{ minWidth: '10vw' }} size="small" aria-label="a-dense-table">
              <TableHead>
                <TableRow>
                  <StyledTableCell align="center">{t("NO.")}</StyledTableCell>
                  <StyledTableCell align="left">{t("Top Domain")}</StyledTableCell>
                  <StyledTableCell align="left">{t("Risky Stake")}</StyledTableCell>
                  <StyledTableCell align="left">{t("Safe Stake")}</StyledTableCell>
                  <StyledTableCell align="left">{t("Premium Rate")}</StyledTableCell>
                  <StyledTableCell align="left">{t("Score")}</StyledTableCell>
                  <StyledTableCell align="center">{t("Operation")}</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => (
                  <StyledTableRow
                    key={row.no}
                    sx={{}}
                  >
                    <StyledTableCell component="th" scope="row" align="center">
                      {page * rowsPerPage+index + 1}
                    </StyledTableCell>
                    <StyledTableCell align="left">{row.name}</StyledTableCell>
                    <StyledTableCell align="left">{row.bad}</StyledTableCell>
                    <StyledTableCell align="left">{row.safe}</StyledTableCell>
                    <StyledTableCell align="left">{row.rate}</StyledTableCell>
                    <StyledTableCell align="left">{row.score}</StyledTableCell>
                    <StyledTableCell align="center">
                      <div className={`mark-button ${row.isInArbitration ? 'disabled' : ''}`} onClick={row.isInArbitration ? null : () => markEvent(row.name)}>
                        {t("Join Stake")}
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
      </div>
    </div>
  )
}

export default Rank