![](https://github.com/takiAA/gotham3/blob/main/images/2251682868507_.pic.jpg?raw=true)

# Gotham3
Gotham3 是一个基于区块链的项目，该项目包含智能合约、谷歌插件和一个基于 Node.js 的后端 Web 应用程序。当前目标是保护当下Web3用户的网站访问安全，我们开发一个名为 BatSheild 的危险网站提醒插件。该插件基于一套名为 Gotham3的链上协议，该协议致力于激励所有人参与危险网站的标记，以此降低危险网站库的维护成本及中心化共识非议。这些危险网站数据将会存储在 Scroll 链上，BatSheild 插件也将实时同步这些链上信息，在用户访问这些危险网站时给予最及时的提醒。除了服务于危险网站标记，Gotham3还将有效应用于金融领域，构造出一种链上的去中心化的具有保险属性的 CDS（Credit Default Swap）。

```
Gotham3
│
├── contracts        # 智能合约
│   ├── ...
│
├── plugin           # 谷歌插件源代码
│   ├── ...
│
└── webapp           # Node.js 后端
    ├── ...

```

### 安装与部署

克隆此仓库到本地：

```
git clone https://github.com/yourusername/Gotham3.git
```

### 智能合约

进入 `contracts` 目录，然后根据项目的构建和部署工具安装依赖

### 谷歌插件

请参阅 [Chrome 插件开发文档](https://developer.chrome.com/docs/extensions/mv3/getstarted/)，了解如何在 Chrome 浏览器中加载和测试插件,使用谷歌浏览器的插件管理功能加载plugin目录即可

### Node.js 后端

```
npm install
node server.js
```

## 贡献

欢迎为 Gotham3 做出贡献！

## 许可

此项目根据 [MIT 许可](https://chat.openai.com/LICENSE) 发布。

## 我们的联系方式

Telegram: YouthSake
