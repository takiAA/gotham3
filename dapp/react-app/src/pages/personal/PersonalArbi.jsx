import React from 'react'
import Web3 from 'web3';
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';
import { toast } from 'react-toastify';
import stakeContractData from "../../abi/stake_abi"
import poolContractData from "../../abi/pool_abi"

import "./personal.css"
import Connect from "../../components/Connect"
import axios from 'axios';
import { API_URLS } from "../../../config/apiUrl";
import { useTranslation } from 'react-i18next';

const { stakeContractABI, stakeContractAddress } = stakeContractData
const { poolContractABI } = poolContractData

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

function createData(no, name, bad, safe, rate, score, address) {
  return { no, name, bad, safe, rate, score, address };
}


const PersonalArbi = () => {
  const [rows, setRows] = React.useState([]);
  const [totalDownvotes, setTotalDownvotes] = React.useState(0);
  const [totalUpvotes, setTotalUpvotes] = React.useState(0);
  const { t } = useTranslation();
  const [provider, setProvider] = React.useState(null);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
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
  // 获取自己的质押记录
  async function getStakes() {
    const durationStr = ["1 days", "2 days", "3 days"]
    // 1. 连接到智能合约
    // 字典
    let stakes = [];
    console.log("使用provider:")
    if (provider) {
      const web3 = new Web3(provider);
      // 从钱包获取当前地址
      const accounts = await web3.eth.getAccounts();
      const currentAccount = accounts[0];
      if (currentAccount == undefined) {
        return
      }
      // 与智能合约交互
      //event Staked(bytes32 indexed website,address indexed poolAddress,address indexed user,uint8 _lockDurationIndex, uint256 amount, bool isUp);
      const stakingFactoryContract = new web3.eth.Contract(stakeContractABI, stakeContractAddress);
      const VotedEvents = await stakingFactoryContract.getPastEvents('Voted', {
        filter: { user: currentAccount },
        fromBlock: 2637721,
        toBlock: 'latest',
      });
      //event CreateStakeContract(bytes32 indexed website,address indexed  creator,uint256 indexed lockDuration,address stakePool,uint256 amount, bool isUp);
      // const initiateEvents = await stakingFactoryContract.getPastEvents('InitiateArbitrated', {
      //   filter: { creator: currentAccount },
      //   fromBlock: 2637721,
      //   toBlock: 'latest',
      // });

      for (let event of VotedEvents) {
        let website = event.returnValues.website;
        let isUp = event.returnValues.isUp;
        let poolAddress = event.returnValues.poolAddress
        const poolContract = new web3.eth.Contract(poolContractABI, poolAddress);
        let upvote = await poolContract.methods.upVote().call();
        let downVote = await poolContract.methods.downVote().call();
        let isInArbitration = await poolContract.methods.isInArbitration().call();
        let stakeInfo = { url: website, upvotes: upvote, downvotes: downVote, myVote: isUp, poolStatus: isInArbitration, pooladdress: poolAddress }
        console.log(stakeInfo)
        stakes.push(stakeInfo);
      }

      // for (let event of events) {
      //   let website = web3.utils.hexToAscii(event.returnValues.website).replace(/\u0000/g, '');
      //   let amount = web3.utils.fromWei(event.returnValues.amount,"ether");
      //   let isUp = event.returnValues.isUp;
      //   let lockDurationIndex =event.returnValues._lockDurationIndex;
      //   let poolAddress=event.returnValues.poolAddress
      //   let stakeInfo={url:website,upvotes: 0, downvotes: 0 , duration:durationStr[lockDurationIndex],pooladdress: poolAddress}
      //   if (isUp) {
      //     stakeInfo.upvotes = amount;
      //   } else {
      //     stakeInfo.downvotes = amount;
      //   }
      //   console.log(stakeInfo)
      //   stakes.push(stakeInfo) ;
      // }
    } else {
      console.log("请先连接钱包")
    }
    return stakes;
  }
  // 解除质押
  const handleUnstake = async (poolAddress) => {
    if (provider) {
      const web3 = new Web3(provider);
      const accounts = await web3.eth.getAccounts();
      const currentAccount = accounts[0];
      const poolContract = new web3.eth.Contract(poolContractABI, poolAddress);
      try {
        let amount = await poolContract.methods.releaseArbitrationReward().call({ from: currentAccount });
        console.log(amount)
        let ArbitrationStatus = await poolContract.methods.status().call()
        if (ArbitrationStatus != 2) {
          toast.info("waiting to Arbitration result")
          return;
        }

        await poolContract.methods.releaseArbitrationReward().send({ from: currentAccount });

        // 在这里，还需要重新获取质押数据以更新ui
        toast.success(`unstake successfully,Get ${amount} BAT`)
      } catch (err) {
        console.log(err)
        const errorMessage = err.message;
        console.error("Unstaking failed:", errorMessage);
        const revertMessage = errorMessage.match('revert (.*)');
        if (revertMessage && revertMessage[1]) {
          // 这里得到的就是 require 的错误信息
          const requireMessage = revertMessage[1];
          console.log(requireMessage)
          toast.error("contract call error");
        } else {
          toast.error("contract call error");
        }
        //toast.error(err.message)
      }
    } else {
      console.log("请先连接钱包")
    }
  };

  async function ArbitrationEvent(url) {
    const origin = window.location.origin;  // 获取当前URL的域名
    const targetUrl = `${origin}/alpha/init?attachUrl=${encodeURIComponent(url)}`;
    //window.open(targetUrl, "_blank"); // 在新窗口中打开URL
    // 或者，希望在当前窗口中打开URL，你可以使用：
    window.location.href = targetUrl;
  }

  function checkArbitrationResult(isInArbitration, downvotes, upvotes) {
    if (isInArbitration) {
      return "In Arbitration"
    } else {
      if (upvotes > downvotes) {
        return "Safe"
      } else {
        return "Risky"
      }
    }
  }

  // 获取被质押网站数据
  const fetchBannedUrls = async () => {
    try {
      const data = await getStakes();
      //const data = response.data.data;
      // 将数据转换为适当的格式
      //let stakeInfo={url:website,upvotes: upvote, downvotes: downVote , myVote:isUp,poolStatus:isInArbitration,pooladdress: poolAddress}
      const rows = data.map((item, index) => createData(index + 1, item.url, item.downvotes, item.upvotes, item.myVote ? 'Safe' : 'Risky', checkArbitrationResult(item.poolStatus, item.downvotes, item.upvotes), item.pooladdress));
      console.log(rows)
      setRows(rows)
      //setTableData(formattedData);
      // 计算总的 upvotes 和 downvotes
      const totalUp = data.reduce((acc, item) => acc + (item.myVote ? 1 : 0), 0);
      const totalDown = data.reduce((acc, item) => acc + (item.myVote ? 0 : 1), 0);
      setTotalDownvotes(totalDown)
      setTotalUpvotes(totalUp)
    } catch (error) {
      console.error('Error fetching banned URLs:', error);
    }
  };

  React.useEffect(() => {
    fetchBannedUrls();
    const interval = setInterval(() => {
      fetchBannedUrls(); // 然后每一分钟运行一次
    }, 180000); // 60000 毫秒 = 1 分钟

    // 清理函数，当组件卸载时取消 interval
    return () => clearInterval(interval);
  }, [provider]);

  return (
    <div className='page'>
      <Connect onProviderUpdate={handleProviderUpdate} />
      <div className='personal-wrap'>
        <div className='up'>
          <div className='target-data'>{t("Arbitration Record")}</div>
          <div className='data-word'>
            <div className='flex-row'>
              <div className="data-name">{t("Risky Arbi Stake")}</div>
              <div className="data-number">{totalDownvotes}</div>
            </div>
            <div className='flex-row'>
              <div className="data-name">{t("Safe Arbi Stake")}</div>
              <div className="data-number">{totalUpvotes}</div>
            </div>
            <div className='flex-row'>
              <div className="data-name">{t("Total Arbitration")}</div>
              <div className="data-number">{totalUpvotes + totalDownvotes}</div>
            </div>
          </div>
        </div>

        <div className='down'>
          <div className='table'>
            <TableContainer component={Paper} style={{ maxWidth: '68vw', maxHeight: "50vh", overflow: 'auto', backgroundColor: 'transparent' }}>
              <Table sx={{ minWidth: '10vw' }} size="small" aria-label="a-dense-table">
                <TableHead>
                  <TableRow>
                    <StyledTableCell>NO.</StyledTableCell>
                    <StyledTableCell align="left">{t("Top Domain")}</StyledTableCell>
                    <StyledTableCell align="left">{t("Risky Arbi Stake")}</StyledTableCell>
                    <StyledTableCell align="left">{t("Safe Arbi Stake")}</StyledTableCell>
                    <StyledTableCell align="left">{t("My Arbitration Stance")}</StyledTableCell>
                    <StyledTableCell align="left">{t("Arbitration Result")}</StyledTableCell>
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
                        {row.no}
                      </StyledTableCell>
                      <StyledTableCell align="left">{row.name}</StyledTableCell>
                      <StyledTableCell align="left">{row.bad}</StyledTableCell>
                      <StyledTableCell align="left">{row.safe}</StyledTableCell>
                      <StyledTableCell align="left">{t(row.rate)}</StyledTableCell>
                      <StyledTableCell align="left">{t(row.score)}</StyledTableCell>
                      <StyledTableCell align="center">
                        <div className='op'>
                          <div className='personal-unmark-button' onClick={() => handleUnstake(row.address)}>
                            {t("GetReward")}
                          </div>
                          {/* <div className='personal-arbi-button' onClick={()=> ArbitrationEvent(row.name)}>
                            {t("Arbitration")}
                          </div> */}
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

export default PersonalArbi