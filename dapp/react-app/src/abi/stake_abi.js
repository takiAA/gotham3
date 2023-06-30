const stakeContractAddress = '0xFcBd4a1FACc289F87f163Dc6f9c56C10629776DB'
const stakeContractABI = [
	{
		"inputs": [
			{
				"internalType": "contract IERC20",
				"name": "_token",
				"type": "address"
			},
			{
				"internalType": "contract IERC721",
				"name": "_SBT",
				"type": "address"
			},
			{
				"internalType": "contract IStakeContract",
				"name": "_stakeContractTemplate",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "website",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "creator",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "lockDuration",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "stakePool",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "isUp",
				"type": "bool"
			}
		],
		"name": "CreateStakeContract",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "website",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint8",
				"name": "_lockDurationIndex",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "poolAddress",
				"type": "address"
			}
		],
		"name": "InitiateArbitrated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "website",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "poolAddress",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint8",
				"name": "_lockDurationIndex",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "isUp",
				"type": "bool"
			}
		],
		"name": "Staked",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "website",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "poolAddress",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint8",
				"name": "_lockDurationIndex",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "isUp",
				"type": "bool"
			}
		],
		"name": "Voted",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "SBT",
		"outputs": [
			{
				"internalType": "contract IERC721",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes",
				"name": "data",
				"type": "bytes"
			}
		],
		"name": "batchStake",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_website",
				"type": "string"
			},
			{
				"internalType": "uint8",
				"name": "_lockDurationIndex",
				"type": "uint8"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "isUp",
				"type": "bool"
			}
		],
		"name": "createStakingContract",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_website",
				"type": "string"
			},
			{
				"internalType": "uint8",
				"name": "_lockDurationIndex",
				"type": "uint8"
			}
		],
		"name": "getStakingContract",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_website",
				"type": "string"
			},
			{
				"internalType": "uint8",
				"name": "_lockDurationIndex",
				"type": "uint8"
			},
			{
				"internalType": "bool",
				"name": "isUp",
				"type": "bool"
			}
		],
		"name": "initiateArbitrationOnContract",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "stakeContractTemplate",
		"outputs": [
			{
				"internalType": "contract IStakeContract",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_website",
				"type": "string"
			},
			{
				"internalType": "uint8",
				"name": "_lockDurationIndex",
				"type": "uint8"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "isUp",
				"type": "bool"
			}
		],
		"name": "stakeOnContract",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "token",
		"outputs": [
			{
				"internalType": "contract IERC20",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_website",
				"type": "string"
			},
			{
				"internalType": "uint8",
				"name": "_lockDurationIndex",
				"type": "uint8"
			},
			{
				"internalType": "bool",
				"name": "isUp",
				"type": "bool"
			}
		],
		"name": "voteOnContract",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]

export default {stakeContractABI , stakeContractAddress }
