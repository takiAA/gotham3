import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import "./navbar.css"
import logo from "../assets/logo.png"
import gotham3 from "../assets/gotham3.png"
import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const pathname = location.pathname;

  async function jumpSite() {
    const w = window.open('about:blank');
    w.location.href = "https://gotham3.io/";
  }

  console.log("pathname is : " + pathname);

  return (
    <>
      <div className='wrap-background'></div>
      <nav className='left-nav' id='sidebar'>
        <div className='main-page' onClick={jumpSite}>
          <img src={logo} className="logo" width="50px" height="50px"></img>
          <img src={gotham3} className="gotham3" width="120px" height="25px"></img>
        </div>
        <div className='tool'>
          <NavLink to="/" className="nav-link">
            <svg className='icon' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M6 2h10v2H6V2zM4 6V4h2v2H4zm0 12H2V6h2v12zm2 2H4v-2h2v2zm12 0H6v2h12v-2zm2-2v2h-2v-2h2zm0 0h2V8h-2v10zM12 6H8v2H6v8h2v2h8v-2h2v-4h-2v4H8V8h4V6zm2 8v-4h2V8h2V6h4V4h-2V2h-2v4h-2v2h-2v2h-4v4h4z" /></svg>
            <h3 className={i18n.language === 'en' ? 'nav__name' : 'zh-nav__name'}>{t("Mark Site")}</h3>
            <div className={pathname === '/' ? 'show-arrow' : 'no-arrow'}>
              <svg className='left-arrow' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z" /></svg>
              <svg className='right-arrow' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z" /></svg>
            </div>
          </NavLink>
          <NavLink to="/faucet" className="nav-link">
            <svg className='icon' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M13 2h-2v2H9v4H7v4H5v6h2v2h2v2h6v-2h2v-2h2v-6h-2V8h-2V4h-2V2zm0 2v4h2v4h2v6h-2v2H9v-2H7v-6h2V8h2V4h2z" /></svg>
            <h3 className={i18n.language === 'en' ? 'nav__name' : 'zh-nav__name'}>{t("Faucet")}</h3>
            <div className={pathname === '/faucet' ? 'show-arrow' : 'no-arrow'}>
              <svg className='left-arrow' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z" /></svg>
              <svg className='right-arrow' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z" /></svg>
            </div>
          </NavLink>
          <NavLink to="/rank" className="nav-link">
            <svg className='icon' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M4 2H2v2h2v2H2v2h2V6h2v2h2V6H6V4h2V2H6v2H4V2Zm12 2v16h6V4h-6Zm2 2h2v12h-2V6Zm-9 4v10h6V10H9Zm2 8v-6h2v6h-2Zm-3-4v6H2v-6h6Zm-2 4v-2H4v2h2Z" /></svg>
            <h3 className={i18n.language === 'en' ? 'nav__name' : 'zh-nav__name'}>{t("Risk Rank")}</h3>
            <div className={pathname === '/rank' ? 'show-arrow' : 'no-arrow'}>
              <svg className='left-arrow' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z" /></svg>
              <svg className='right-arrow' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z" /></svg>
            </div>
          </NavLink>
          <NavLink to="/init" className="nav-link">
            <svg className='icon' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M17 2h-2v2H9V2H7v2H3v18h4v-2H5V10h14v10h-2v2h4V4h-4V2zM7 6h12v2H5V6h2zm6 16h-2v-6H9v-2h2v-2h2v2h2v2h-2v6zm2-6v2h2v-2h-2zm-6 0v2H7v-2h2z" /></svg>
            <h3 className={i18n.language === 'en' ? 'nav__name' : 'zh-nav__name'}>{t("Start Arbitration")}</h3>
            <div className={pathname === '/init' ? 'show-arrow' : 'no-arrow'}>
              <svg className='left-arrow' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z" /></svg>
              <svg className='right-arrow' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z" /></svg>
            </div>
          </NavLink>
          <NavLink to="/arbi" className="nav-link">
            <svg className='icon' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M15 2h2v2h4v18H3V4h4V2h2v2h6V2zM9 6H5v2h14V6H9zm-4 4v10h14V10H5zm6 2h2v2h2v2h-2v2h-2v-2H9v-2h2v-2z" /></svg>
            <h3 className={i18n.language === 'en' ? 'nav__name' : 'zh-nav__name'}>{t("Join Arbitration")}</h3>
            <div className={pathname === '/arbi' ? 'show-arrow' : 'no-arrow'}>
              <svg className='left-arrow' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z" /></svg>
              <svg className='right-arrow' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z" /></svg>
            </div>
          </NavLink>
          <NavLink to="/personal" className="nav-link">
            <svg className='icon' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M15 2H9v2H7v4H4v14h16V8h-3V4h-2V2zm0 2v4H9V4h6zm-6 6h9v10H6V10h3zm4 3h-2v4h2v-4z" /></svg>
            <h3 className={i18n.language === 'en' ? 'nav__name' : 'zh-nav__name'}>{t("Personal Stake")}</h3>
            <div className={pathname === '/personal' ? 'show-arrow' : 'no-arrow'}>
              <svg className='left-arrow' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z" /></svg>
              <svg className='right-arrow' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z" /></svg>
            </div>
          </NavLink>
          <NavLink to="/personalArbi" className="nav-link">
            <svg className='icon' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M19 3H5v2H3v14h2v2h14v-2h2V5h-2V3zm0 2v14H5V5h14zm-8 2h2v6h4v2h-6V7z" /></svg>
            <h3 className={i18n.language === 'en' ? 'nav__name' : 'zh-nav__name'}>{t("Arbitration record")}</h3>
            <div className={pathname === '/personalArbi' ? 'show-arrow' : 'no-arrow'}>
              <svg className='left-arrow' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z" /></svg>
              <svg className='right-arrow' xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#ffffff" d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z" /></svg>
            </div>
          </NavLink>
        </div>
        <div className='bottom-switcher'>
          <div className={i18n.language === 'en' ? 'en-button' : 'zh-en-button'} onClick={() => i18n.changeLanguage("en")} >{t("EN")}</div>
          <div className='v-line'>/</div>
          <div className={i18n.language === 'en' ? 'zh-button' : 'zh-zh-button'} onClick={() => i18n.changeLanguage("zh")} >{t("ZH")}</div>
        </div>
      </nav>
    </>
  )
}

export default Navbar