import React from 'react'
import "./mark.css"
import MarkCard from "../../components/MarkCard";
import Connect from "../../components/Connect"
import DataDisplay from '../../components/DataDisplay';
import { useTranslation } from 'react-i18next';

const Mark = () => {
  const { t } = useTranslation();
  const [url, setUrl] = React.useState('');
  const [provider, setProvider] = React.useState(null);
  const [typeSelect, setTypeSelect] = React.useState('Website');

  // 回调函数
  const handleProviderUpdate = (newProvider) => {
    setProvider(newProvider);
  };
  React.useEffect(() => {
    const currentUrl = getQueryStringParameters();
    if (currentUrl.attachUrl) {
      setUrl(currentUrl.attachUrl);
    }
  }, [provider]);

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

  // 改变数据查询类型
  function changeType(type) {
    setTypeSelect(type);
  }

  return (
    <>
      <div className='page'>
        <Connect onProviderUpdate={handleProviderUpdate} />
        <div className='mark-center'>
          <div className='mark-up'>
            <div className='target'>{t("Target")}</div>
            <div className='url'>
              <svg className='left-arrow' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M9.525 18.025q-.5.325-1.012.038T8 17.175V6.825q0-.6.513-.888t1.012.038l8.15 5.175q.45.3.45.85t-.45.85l-8.15 5.175Z" /></svg>
              <div className='url-wrap'>
                <input
                  className="ftx-url"
                  type="text"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder={typeSelect ==='Website' ? "https://ftx.com" : typeSelect === 'Twitter' ? "@Gotham3_IO" : "gotham3.eth"}
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
          </div>
          <div className='mark-down'>
            <div className='data-wrap'>
              <div className='target-data'>{t("Data")}</div>
              <DataDisplay url={url} provider={provider} urlType={typeSelect} />
            </div>
            <div className='markcard-wrap'>
              <MarkCard provider={provider} url={url} urlType={typeSelect} />
            </div>
          </div>
        </div>
      </div>
      <div className='op-area'>
      </div>
    </>
  )
}

export default Mark