export const PRICE_ORDER_PIPELINE_ABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "config",
        "type": "tuple",
        "internalType": "struct PriceOrderPipeline.Config",
        "components": [
          {
            "name": "originPool",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "vault",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "originChainId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "mode",
            "type": "uint8",
            "internalType": "enum PriceOrderMode"
          },
          {
            "name": "threshold",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "percent",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "cooldown",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "dropBps",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "windowSeconds",
            "type": "uint32",
            "internalType": "uint32"
          }
        ]
      }
    ],
    "stateMutability": "payable"
  },
  {
    "type": "receive",
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "CALLBACK_TTL",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "cooldown",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "coverDebt",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "dropBps",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "lastTriggeredTimestamp",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "mode",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "enum PriceOrderMode"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "originChainId",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "originPool",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "pay",
    "inputs": [
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "percent",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "policyComplete",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "react",
    "inputs": [
      {
        "name": "log",
        "type": "tuple",
        "internalType": "struct IReactive.LogRecord",
        "components": [
          {
            "name": "chain_id",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "_contract",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "topic_0",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "topic_1",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "topic_2",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "topic_3",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "data",
            "type": "bytes",
            "internalType": "bytes"
          },
          {
            "name": "block_number",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "op_code",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "block_hash",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "tx_hash",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "log_index",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "threshold",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "vault",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "windowSeconds",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "Callback",
    "inputs": [
      {
        "name": "chain_id",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "_contract",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "gas_limit",
        "type": "uint64",
        "indexed": true,
        "internalType": "uint64"
      },
      {
        "name": "payload",
        "type": "bytes",
        "indexed": false,
        "internalType": "bytes"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OmniCallbackRequested",
    "inputs": [
      {
        "name": "chain_id",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "_contract",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "gas_limit",
        "type": "uint64",
        "indexed": true,
        "internalType": "uint64"
      },
      {
        "name": "payload",
        "type": "bytes",
        "indexed": false,
        "internalType": "bytes"
      }
    ],
    "anonymous": false
  }
] as const;

export const PRICE_ORDER_PIPELINE_BYTECODE = '0x6101a060405260405162001953380380620019538339810160408190526200002791620006e7565b600280545f80546001600160a01b03191662ffffff908117825590819052600160208190527f82ea04094b91fdbcc6bc700815069948943553fb456ac308389bf83006127735805460ff191690911790553b156001600160a81b03199091161763ffffff001790557388888888888888888888888888888888888888883b5f03620000f95760405162461bcd60e51b815260206004820152601760248201527f4f6d6e692073797374656d20756e617661696c61626c6500000000000000000060448201526064015b60405180910390fd5b80516001600160a01b0316158015906200011f575060208101516001600160a01b031615155b6200015e5760405162461bcd60e51b815260206004820152600e60248201526d125b9d985b1a59081b585c9ad95d60921b6044820152606401620000f0565b5f6002826060015160038111156200017a576200017a6200079e565b1490505f6003836060015160038111156200019957620001996200079e565b14905081620001ac5762014a34620001b0565b6105155b836040015114620002045760405162461bcd60e51b815260206004820152601460248201527f496e76616c6964206f726967696e20636861696e0000000000000000000000006044820152606401620000f0565b8062000231575f8360a0015161ffff161180156200022b575060648360a0015161ffff1611155b6200023c565b60a083015161ffff16155b6200027f5760405162461bcd60e51b8152602060048201526012602482015271496e76616c69642070657263656e7461676560701b6044820152606401620000f0565b811562000322576080830151158015620002a057505f8360e0015161ffff16115b8015620002b757506127108360e0015161ffff1611155b8015620002ce57505f83610100015163ffffffff16115b6200031c5760405162461bcd60e51b815260206004820152601e60248201527f496e76616c69642076656c6f6369747920636f6e66696775726174696f6e00006044820152606401620000f0565b620003a0565b6080830151158015906200033c575060e083015161ffff16155b801562000352575061010083015163ffffffff16155b620003a05760405162461bcd60e51b815260206004820152601f60248201527f496e76616c6964207468726573686f6c6420636f6e66696775726174696f6e006044820152606401620000f0565b82516001600160a01b0390811660805260208401511660a052604083015160c05260608301516003811115620003da57620003da6200079e565b60e0816003811115620003f157620003f16200079e565b905250608083015161010090815260a084015161ffff9081166101205260c085015163ffffffff9081166101405260e08601519091166101605290840151166101805260028054610100600160a81b031916748888888888888888888888888888888888888888001790555f80547388888888888888888888888888888888888888886001600160a01b0319909116811782559052600160208190527f5c22f199cf3c2fa5f81fd82c1cdca9cc20739f1c8c6ac75b7a0f4a5b957929f5805460ff1916909117905560025460c0516080516040516305a6aced60e41b815260048101929092526001600160a01b0390811660248301527f1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad160448301525f8051602062001933833981519152606483018190526084830181905260a483015261010090920490911690635a6aced09060c4015f604051808303815f87803b1580156200055a575f80fd5b505af11580156200056d573d5f803e3d5ffd5b505f92506200057a915050565b836060015160038111156200059357620005936200079e565b14806200059d5750805b15620006575760025460a0516040516305a6aced60e41b815262014a3460048201526001600160a01b0391821660248201527fdff6e6add1ccd6340dab023e5c029a5a64be95a2ac44cafde196a970d16ddee760448201523060648201525f80516020620019338339815191526084820181905260a48201526101009092041690635a6aced09060c4015f604051808303815f87803b1580156200063f575f80fd5b505af115801562000652573d5f803e3d5ffd5b505050505b505050620007b2565b60405161012081016001600160401b03811182821017156200069057634e487b7160e01b5f52604160045260245ffd5b60405290565b80516001600160a01b0381168114620006ad575f80fd5b919050565b805160048110620006ad575f80fd5b805161ffff81168114620006ad575f80fd5b805163ffffffff81168114620006ad575f80fd5b5f6101208284031215620006f9575f80fd5b6200070362000660565b6200070e8362000696565b81526200071e6020840162000696565b6020820152604083015160408201526200073b60608401620006b2565b6060820152608083015160808201526200075860a08401620006c1565b60a08201526200076b60c08401620006d3565b60c08201526200077e60e08401620006c1565b60e082015261010062000793818501620006d3565b908201529392505050565b634e487b7160e01b5f52602160045260245ffd5b60805160a05160c05160e051610100516101205161014051610160516101805161109d620008965f395f81816102650152610baf01525f81816103590152610c0401525f81816102f3015261066b01525f81816102ad015261091701525f8181610232015281816107b0015281816107d801526108ea01525f818161016a0152818161042f0152818161046a01528181610728015281816107790152818161087a01526108b301525f8181610103015261054e01525f81816103a1015281816104bc0152818161099e0152610a5001525f81816101e7015261057f015261109d5ff3fe6080604052600436106100e7575f3560e01c80634cb5929a11610087578063c290d69111610057578063c290d69114610329578063d912949814610348578063fadfb6d21461037b578063fbfa77cf14610390575f80fd5b80634cb5929a1461025457806370ba11131461029c578063787a08a6146102e25780637a90b99014610315575f80fd5b80632b509e52116100c25780632b509e52146101995780632fbd4693146101ad57806330ee7a00146101d657806342cde4e814610221575f80fd5b80630ac7f561146100f25780630d152c2c14610138578063295a521214610159575f80fd5b366100ee57005b5f80fd5b3480156100fd575f80fd5b506101257f000000000000000000000000000000000000000000000000000000000000000081565b6040519081526020015b60405180910390f35b348015610143575f80fd5b50610157610152366004610d68565b6103c3565b005b348015610164575f80fd5b5061018c7f000000000000000000000000000000000000000000000000000000000000000081565b60405161012f9190610ddb565b3480156101a4575f80fd5b5061012560b481565b3480156101b8575f80fd5b506004546101c69060ff1681565b604051901515815260200161012f565b3480156101e1575f80fd5b506102097f000000000000000000000000000000000000000000000000000000000000000081565b6040516001600160a01b03909116815260200161012f565b34801561022c575f80fd5b506101257f000000000000000000000000000000000000000000000000000000000000000081565b34801561025f575f80fd5b506102877f000000000000000000000000000000000000000000000000000000000000000081565b60405163ffffffff909116815260200161012f565b3480156102a7575f80fd5b506102cf7f000000000000000000000000000000000000000000000000000000000000000081565b60405161ffff909116815260200161012f565b3480156102ed575f80fd5b506102877f000000000000000000000000000000000000000000000000000000000000000081565b348015610320575f80fd5b50610157610abb565b348015610334575f80fd5b50610157610343366004610def565b610b40565b348015610353575f80fd5b506102cf7f000000000000000000000000000000000000000000000000000000000000000081565b348015610386575f80fd5b5061012560035481565b34801561039b575f80fd5b506102097f000000000000000000000000000000000000000000000000000000000000000081565b337388888888888888888888888888888888888888881461041e5760405162461bcd60e51b815260206004820152601060248201526f4f6e6c79204f6d6e692073797374656d60801b60448201526064015b60405180910390fd5b60045460ff161561042c5750565b5f7f0000000000000000000000000000000000000000000000000000000000000000600381111561045f5761045f610da7565b148061049c575060037f0000000000000000000000000000000000000000000000000000000000000000600381111561049a5761049a610da7565b145b80156104ab5750803562014a34145b80156104f757506001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000166104ec6040830160208401610e06565b6001600160a01b0316145b8015610526575060408101357fdff6e6add1ccd6340dab023e5c029a5a64be95a2ac44cafde196a970d16ddee7145b80156105355750606081013530145b1561054a57506004805460ff19166001179055565b80357f00000000000000000000000000000000000000000000000000000000000000001415806105bb57506001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000166105af6040830160208401610e06565b6001600160a01b031614155b806105ea575060408101357f1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad114155b8061060457506105fd60c0820182610e2c565b9050604014155b80610611575060e0810135155b156106195750565b6005548160e00135108061064457506005548160e00135148015610644575060065481610160013511155b1561064c5750565b60e0810135600555610160810135600655600354158015906106a057507f000000000000000000000000000000000000000000000000000000000000000063ffffffff166003544261069e9190610e8a565b105b156106a85750565b5f806106b760c0840184610e2c565b8101906106c49190610eb8565b91509150816001600160701b03165f14806106e657506001600160701b038116155b156106f057505050565b5f826001600160701b0316826001600160701b0316670de0b6b3a76400006107189190610ee9565b6107229190610f00565b905060027f0000000000000000000000000000000000000000000000000000000000000000600381111561075857610758610da7565b036107755761076681610ba1565b6107705750505050565b610805565b60017f000000000000000000000000000000000000000000000000000000000000000060038111156107a9576107a9610da7565b146107d6577f000000000000000000000000000000000000000000000000000000000000000081116107fa565b7f000000000000000000000000000000000000000000000000000000000000000081105b156108055750505050565b426003556040805160a0810182525f91819087359061082990890160208a01610e06565b6040805160208101939093526001600160a01b03909116908201526101408801356060820152610160880135608082015260a0016040516020818303038152906040528051906020012081526020017f000000000000000000000000000000000000000000000000000000000000000060038111156108aa576108aa610da7565b815260200160037f000000000000000000000000000000000000000000000000000000000000000060038111156108e3576108e3610da7565b1461090e577f0000000000000000000000000000000000000000000000000000000000000000610910565b835b815261ffff7f000000000000000000000000000000000000000000000000000000000000000016602082015260400161094a60b442610f1f565b81525090505f8082604051602401610963929190610f32565b60408051601f19818403018152918152602080830180516001600160e01b03166375e565ef60e11b179052815160808101835262014a3481527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316918101919091526205573081830152606081018390529051636407b0c160e01b815291925073888888888888888888888888888888888888888891636407b0c191610a1391600401610fd1565b5f604051808303815f87803b158015610a2a575f80fd5b505af1158015610a3c573d5f803e3d5ffd5b505050506205573067ffffffffffffffff167f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031662014a347f855d9001d076fb37b22e41e0cd3b2833d470144db45b2554095f28fb8ddae48084604051610aab9190611023565b60405180910390a4505050505050565b5f80546040516326db15bb60e21b81523060048201526001600160a01b0390911690639b6c56ec90602401602060405180830381865afa158015610b01573d5f803e3d5ffd5b505050506040513d601f19601f82011682018060405250810190610b259190611035565b5f54909150610b3d906001600160a01b031682610c6c565b50565b335f9081526001602052604090205460ff16610b975760405162461bcd60e51b8152602060048201526016602482015275417574686f72697a65642073656e646572206f6e6c7960501b6044820152606401610415565b610b3d3382610c6c565b5f6008545f1480610be557507f000000000000000000000000000000000000000000000000000000000000000063ffffffff1660085442610be29190610e8a565b10155b15610bf65750600755426008555f90565b60075482101580610c5057507f000000000000000000000000000000000000000000000000000000000000000061ffff16600754610c349190610ee9565b82600754610c429190610e8a565b610c4e90612710610ee9565b105b15610c5c57505f919050565b50505f6007819055600855600190565b80471015610cb15760405162461bcd60e51b8152602060048201526012602482015271496e73756666696369656e742066756e647360701b6044820152606401610415565b8015610d6457604080515f808252602082019092526001600160a01b038416908390604051610ce0919061104c565b5f6040518083038185875af1925050503d805f8114610d1a576040519150601f19603f3d011682016040523d82523d5f602084013e610d1f565b606091505b5050905080610d625760405162461bcd60e51b815260206004820152600f60248201526e151c985b9cd9995c8819985a5b1959608a1b6044820152606401610415565b505b5050565b5f60208284031215610d78575f80fd5b813567ffffffffffffffff811115610d8e575f80fd5b82016101808185031215610da0575f80fd5b9392505050565b634e487b7160e01b5f52602160045260245ffd5b60048110610dd757634e487b7160e01b5f52602160045260245ffd5b9052565b60208101610de98284610dbb565b92915050565b5f60208284031215610dff575f80fd5b5035919050565b5f60208284031215610e16575f80fd5b81356001600160a01b0381168114610da0575f80fd5b5f808335601e19843603018112610e41575f80fd5b83018035915067ffffffffffffffff821115610e5b575f80fd5b602001915036819003821315610e6f575f80fd5b9250929050565b634e487b7160e01b5f52601160045260245ffd5b81810381811115610de957610de9610e76565b80356001600160701b0381168114610eb3575f80fd5b919050565b5f8060408385031215610ec9575f80fd5b610ed283610e9d565b9150610ee060208401610e9d565b90509250929050565b8082028115828204841417610de957610de9610e76565b5f82610f1a57634e487b7160e01b5f52601260045260245ffd5b500490565b80820180821115610de957610de9610e76565b6001600160a01b0383168152815160208083019190915282015160c0820190610f5e6040840182610dbb565b506040830151606083015260608301516080830152608083015160a08301529392505050565b5f5b83811015610f9e578181015183820152602001610f86565b50505f910152565b5f8151808452610fbd816020860160208601610f84565b601f01601f19169290920160200192915050565b602081528151602082015260018060a01b03602083015116604082015267ffffffffffffffff60408301511660608201525f606083015160808084015261101b60a0840182610fa6565b949350505050565b602081525f610da06020830184610fa6565b5f60208284031215611045575f80fd5b5051919050565b5f825161105d818460208701610f84565b919091019291505056fea2646970667358221220c922b85542ebfe67627f4f2640cd6c4f4ff1843837817b9349e28e5ddfba034664736f6c63430008140033a65f96fc951c35ead38878e0f0b7a3c744a6f5ccc1476b313353ce31712313ad' as const;

export const PRICE_ORDER_PIPELINE_SOURCE = "// SPDX-License-Identifier: MIT\npragma solidity >=0.8.20;\n\nimport {IReactive} from '@reactive-network/reactive-lib/src/interfaces/IReactive.sol';\nimport {AbstractReactive} from '@reactive-network/reactive-lib/src/abstract-base/AbstractReactive.sol';\nimport {ISystemContract} from '@reactive-network/reactive-lib/src/interfaces/ISystemContract.sol';\nimport {IOmniCallbackSystem} from './StopLoss_Pipeline.sol';\nimport {PriceOrderVault, PriceOrder, PriceOrderMode} from './PriceOrderVault.sol';\n\n/// @notice Subscribes to a configured pool and hands price orders to its Base Sepolia Vault.\ncontract PriceOrderPipeline is IReactive, AbstractReactive {\n    struct Config {\n        address originPool;\n        address vault;\n        uint256 originChainId;\n        PriceOrderMode mode;\n        uint256 threshold;\n        uint16 percent;\n        uint32 cooldown;\n        uint16 dropBps;\n        uint32 windowSeconds;\n    }\n\n    address private constant OMNI_SYSTEM = 0x8888888888888888888888888888888888888888;\n    uint256 private constant BASE_SEPOLIA = 84532;\n    uint256 private constant UNICHAIN_SEPOLIA = 1301;\n    uint256 private constant SYNC = uint256(keccak256(\"Sync(uint112,uint112)\"));\n    uint256 private constant POLICY_COMPLETED = uint256(keccak256(\"OrderPolicyCompleted(address)\"));\n    uint64 private constant CALLBACK_GAS = 350_000;\n    uint256 public constant CALLBACK_TTL = 180;\n\n    address public immutable originPool;\n    address public immutable vault;\n    uint256 public immutable originChainId;\n    PriceOrderMode public immutable mode;\n    uint256 public immutable threshold;\n    uint16 public immutable percent;\n    uint32 public immutable cooldown;\n    uint16 public immutable dropBps;\n    uint32 public immutable windowSeconds;\n\n    uint256 public lastTriggeredTimestamp;\n    bool public policyComplete;\n    uint256 private lastSourceBlock;\n    uint256 private lastSourceIndex;\n    uint256 private anchorPrice;\n    uint256 private anchorTime;\n\n    event OmniCallbackRequested(uint256 indexed chain_id, address indexed _contract, uint64 indexed gas_limit, bytes payload);\n\n    constructor(Config memory config) payable {\n        require(OMNI_SYSTEM.code.length != 0, \"Omni system unavailable\");\n        require(config.originPool != address(0) && config.vault != address(0), \"Invalid market\");\n        bool hedge = config.mode == PriceOrderMode.CrossChainHedge;\n        bool ladder = config.mode == PriceOrderMode.Ladder;\n        require(config.originChainId == (hedge ? UNICHAIN_SEPOLIA : BASE_SEPOLIA), \"Invalid origin chain\");\n        require(ladder ? config.percent == 0 : config.percent > 0 && config.percent <= 100, \"Invalid percentage\");\n        if (hedge) {\n            require(config.threshold == 0 && config.dropBps > 0 && config.dropBps <= 10_000 && config.windowSeconds > 0,\n                \"Invalid velocity configuration\");\n        } else {\n            require(config.threshold != 0 && config.dropBps == 0 && config.windowSeconds == 0,\n                \"Invalid threshold configuration\");\n        }\n\n        originPool = config.originPool;\n        vault = config.vault;\n        originChainId = config.originChainId;\n        mode = config.mode;\n        threshold = config.threshold;\n        percent = config.percent;\n        cooldown = config.cooldown;\n        dropBps = config.dropBps;\n        windowSeconds = config.windowSeconds;\n\n        vendor = service = ISystemContract(payable(OMNI_SYSTEM));\n        addAuthorizedSender(OMNI_SYSTEM);\n        service.subscribe(originChainId, originPool, SYNC, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);\n        if (config.mode == PriceOrderMode.OneShotStopLoss || ladder) {\n            service.subscribe(BASE_SEPOLIA, vault, POLICY_COMPLETED, uint256(uint160(address(this))),\n                REACTIVE_IGNORE, REACTIVE_IGNORE);\n        }\n    }\n\n    function react(LogRecord calldata log) external {\n        require(msg.sender == OMNI_SYSTEM, \"Only Omni system\");\n        if (policyComplete) return;\n        if ((mode == PriceOrderMode.OneShotStopLoss || mode == PriceOrderMode.Ladder)\n            && log.chain_id == BASE_SEPOLIA && log._contract == vault && log.topic_0 == POLICY_COMPLETED\n            && log.topic_1 == uint256(uint160(address(this)))) {\n            policyComplete = true;\n            return;\n        }\n        if (log.chain_id != originChainId || log._contract != originPool || log.topic_0 != SYNC\n            || log.data.length != 64 || log.block_number == 0) return;\n        if (log.block_number < lastSourceBlock\n            || (log.block_number == lastSourceBlock && log.log_index <= lastSourceIndex)) return;\n\n        // Observations received during cooldown must not become eligible on replay.\n        lastSourceBlock = log.block_number;\n        lastSourceIndex = log.log_index;\n        if (lastTriggeredTimestamp != 0 && block.timestamp - lastTriggeredTimestamp < cooldown) return;\n\n        (uint112 reserve0, uint112 reserve1) = abi.decode(log.data, (uint112, uint112));\n        if (reserve0 == 0 || reserve1 == 0) return;\n        uint256 price = uint256(reserve1) * 1e18 / reserve0;\n        if (mode == PriceOrderMode.CrossChainHedge) {\n            if (!_velocityReached(price)) return;\n        } else if (mode == PriceOrderMode.TakeProfit ? price < threshold : price > threshold) {\n            return;\n        }\n\n        lastTriggeredTimestamp = block.timestamp;\n        PriceOrder memory order = PriceOrder({\n            executionId: keccak256(abi.encode(log.chain_id, log._contract, log.tx_hash, log.log_index)),\n            mode: mode,\n            threshold: mode == PriceOrderMode.Ladder ? price : threshold,\n            percent: percent,\n            expiresAt: block.timestamp + CALLBACK_TTL\n        });\n        bytes memory payload = abi.encodeCall(PriceOrderVault.executePriceOrder, (address(0), order));\n        IOmniCallbackSystem(OMNI_SYSTEM).requestCallbackV_1_0(\n            IOmniCallbackSystem.Configuration(BASE_SEPOLIA, vault, CALLBACK_GAS, payload)\n        );\n        emit OmniCallbackRequested(BASE_SEPOLIA, vault, CALLBACK_GAS, payload);\n    }\n\n    function _velocityReached(uint256 price) private returns (bool) {\n        if (anchorTime == 0 || block.timestamp - anchorTime >= windowSeconds) {\n            anchorPrice = price;\n            anchorTime = block.timestamp;\n            return false;\n        }\n        if (price >= anchorPrice || (anchorPrice - price) * 10_000 < anchorPrice * dropBps) return false;\n        anchorPrice = 0;\n        anchorTime = 0;\n        return true;\n    }\n}\n";

