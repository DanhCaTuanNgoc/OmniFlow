export const PRICE_GATE_PIPELINE_ABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "config",
        "type": "tuple",
        "internalType": "struct PriceGatePipeline.Config",
        "components": [
          {
            "name": "primaryPool",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "confirmationPool",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "vault",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "primaryThreshold",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "confirmationThreshold",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "freshnessSeconds",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "cooldownSeconds",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "requireBoth",
            "type": "bool",
            "internalType": "bool"
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
    "name": "confirmationPool",
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
    "name": "confirmationThreshold",
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
    "name": "cooldownSeconds",
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
    "name": "episodeActive",
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
    "name": "freshnessSeconds",
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
    "name": "primaryPool",
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
    "name": "primaryThreshold",
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
    "name": "requireBoth",
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

export const PRICE_GATE_PIPELINE_BYTECODE = '0x6101806040526040516200148b3803806200148b8339810160408190526200002791620004a0565b600280545f80546001600160a01b03191662ffffff908117825590819052600160208190527f82ea04094b91fdbcc6bc700815069948943553fb456ac308389bf83006127735805460ff191690911790553b156001600160a81b03199091161763ffffff001790557388888888888888888888888888888888888888883b5f03620000f95760405162461bcd60e51b815260206004820152601760248201527f4f6d6e692073797374656d20756e617661696c61626c6500000000000000000060448201526064015b60405180910390fd5b60408101516001600160a01b0316158015906200011f575080516001600160a01b031615155b801562000138575060208101516001600160a01b031615155b80156200015e575080602001516001600160a01b0316815f01516001600160a01b031614155b6200019c5760405162461bcd60e51b815260206004820152600d60248201526c496e76616c696420706f6f6c7360981b6044820152606401620000f0565b606081015115801590620001b35750608081015115155b8015620001c957505f8160a0015163ffffffff16115b8015620001e1575060b48160a0015163ffffffff1611155b6200022f5760405162461bcd60e51b815260206004820152601a60248201527f496e76616c6964206761746520636f6e66696775726174696f6e0000000000006044820152606401620000f0565b80516001600160a01b039081166080908152602080840151831660a0908152604085015190931660c0908152606085015160e090815292850151610100529284015163ffffffff90811661012052928401519092166101405282015115156101605260028054610100600160a81b031916748888888888888888888888888888888888888888001790555f80547388888888888888888888888888888888888888886001600160a01b03199091168117825590526001908190527f5c22f199cf3c2fa5f81fd82c1cdca9cc20739f1c8c6ac75b7a0f4a5b957929f5805460ff191690911790556002546080516040516305a6aced60e41b815262014a3460048201526001600160a01b0391821660248201525f805160206200146b83398151915260448201525f805160206200144b833981519152606482018190526084820181905260a48201526101009092041690635a6aced09060c4015f604051808303815f87803b158015620003a0575f80fd5b505af1158015620003b3573d5f803e3d5ffd5b505060025460a0516040516305a6aced60e41b815262014a3460048201526001600160a01b0391821660248201525f805160206200146b83398151915260448201525f805160206200144b833981519152606482018190526084820181905260a4820152610100909204169250635a6aced0915060c4015f604051808303815f87803b15801562000442575f80fd5b505af115801562000455573d5f803e3d5ffd5b50505050506200056e565b80516001600160a01b038116811462000477575f80fd5b919050565b805163ffffffff8116811462000477575f80fd5b8051801515811462000477575f80fd5b5f610100808385031215620004b3575f80fd5b604051908101906001600160401b0382118183101715620004e257634e487b7160e01b5f52604160045260245ffd5b81604052620004f18462000460565b8152620005016020850162000460565b6020820152620005146040850162000460565b604082015260608401516060820152608084015160808201526200053b60a085016200047c565b60a08201526200054e60c085016200047c565b60c08201526200056160e0850162000490565b60e0820152949350505050565b60805160a05160c05160e05161010051610120516101405161016051610e3c6200060f5f395f81816102670152610a5d01525f81816101ec01526106af01525f818160ff015261062c01525f8181610315015261057001525f8181610160015261059601525f81816102e2015281816107f801526108aa01525f818161029a015261044c01525f81816101a101528181610400015261049b0152610e3c5ff3fe6080604052600436106100c2575f3560e01c8063c290d6911161007c578063e283e8ed11610057578063e283e8ed14610289578063fadfb6d2146102bc578063fbfa77cf146102d1578063fceb17eb14610304575f80fd5b8063c290d6911461020e578063ccecbdaf1461022d578063d7b34adf14610256575f80fd5b80630d152c2c146100cd57806315d9138f146100ee5780637a90b9901461013b578063928efc621461014f5780639be3d69c14610190578063b8221bc4146101db575f80fd5b366100c957005b5f80fd5b3480156100d8575f80fd5b506100ec6100e7366004610b9b565b610337565b005b3480156100f9575f80fd5b506101217f000000000000000000000000000000000000000000000000000000000000000081565b60405163ffffffff90911681526020015b60405180910390f35b348015610146575f80fd5b506100ec610918565b34801561015a575f80fd5b506101827f000000000000000000000000000000000000000000000000000000000000000081565b604051908152602001610132565b34801561019b575f80fd5b506101c37f000000000000000000000000000000000000000000000000000000000000000081565b6040516001600160a01b039091168152602001610132565b3480156101e6575f80fd5b506101217f000000000000000000000000000000000000000000000000000000000000000081565b348015610219575f80fd5b506100ec610228366004610bda565b61099d565b348015610238575f80fd5b506009546102469060ff1681565b6040519015158152602001610132565b348015610261575f80fd5b506102467f000000000000000000000000000000000000000000000000000000000000000081565b348015610294575f80fd5b506101c37f000000000000000000000000000000000000000000000000000000000000000081565b3480156102c7575f80fd5b50610182600a5481565b3480156102dc575f80fd5b506101c37f000000000000000000000000000000000000000000000000000000000000000081565b34801561030f575f80fd5b506101827f000000000000000000000000000000000000000000000000000000000000000081565b33738888888888888888888888888888888888888888146103925760405162461bcd60e51b815260206004820152601060248201526f4f6e6c79204f6d6e692073797374656d60801b60448201526064015b60405180910390fd5b803562014a341415806103c9575060408101357f1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad114155b806103e357506103dc60c0820182610bf1565b9050604014155b806103f0575060e0810135155b8061048857506001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000166104306040830160208401610c3b565b6001600160a01b03161415801561048857506001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001661047c6040830160208401610c3b565b6001600160a01b031614155b156104905750565b5f6001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000166104cb6040840160208501610c3b565b6001600160a01b03161490505f816104e45760066104e7565b60035b805490915060e084013510806105155750805460e08401351480156105155750806001015483610160013511155b1561051f57505050565b6105276109fe565b610536576009805460ff191690555b60e0830135815561016083013560018201555f8061055760c0860186610bf1565b8101906105649190610c7c565b915091505f84610594577f00000000000000000000000000000000000000000000000000000000000000006105b6565b7f00000000000000000000000000000000000000000000000000000000000000005b90505f6001600160701b038416158015906105d957506001600160701b03831615155b8015610615575081846001600160701b0316846001600160701b0316670de0b6b3a76400006106089190610cc1565b6106129190610cde565b11155b905080610622575f610652565b61065263ffffffff7f00000000000000000000000000000000000000000000000000000000000000001642610cfd565b60028601805467ffffffffffffffff191667ffffffffffffffff9290921691909117905561067e6109fe565b6106955750506009805460ff191690555050505050565b60095460ff16806106e45750600a54158015906106e457507f000000000000000000000000000000000000000000000000000000000000000063ffffffff16600a54426106e29190610d10565b105b156106f25750505050505050565b6009805460ff1916600117905542600a55604080516060810182525f9181908a3590610723908c0160208d01610c3b565b6040805160208101939093526001600160a01b03909116908201526101408b013560608201526101608b0135608082015260a00160408051808303601f190181529181528151602092830120835260055467ffffffffffffffff9081168484015260085481169382019390935280515f6024820181905285516044830152928501518416606482015290840151909216608483015291925060a40160408051601f19818403018152918152602080830180516001600160e01b031662b0ac3f60e41b179052815160808101835262014a3481527f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316918101919091526205573081830152606081018390529051636407b0c160e01b815291925073888888888888888888888888888888888888888891636407b0c19161086d91600401610d70565b5f604051808303815f87803b158015610884575f80fd5b505af1158015610896573d5f803e3d5ffd5b505050506205573067ffffffffffffffff167f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031662014a347f855d9001d076fb37b22e41e0cd3b2833d470144db45b2554095f28fb8ddae480846040516109059190610dc2565b60405180910390a4505050505050505050565b5f80546040516326db15bb60e21b81523060048201526001600160a01b0390911690639b6c56ec90602401602060405180830381865afa15801561095e573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906109829190610dd4565b5f5490915061099a906001600160a01b031682610a9f565b50565b335f9081526001602052604090205460ff166109f45760405162461bcd60e51b8152602060048201526016602482015275417574686f72697a65642073656e646572206f6e6c7960501b6044820152606401610389565b61099a3382610a9f565b6005545f90819067ffffffffffffffff1615801590610a2b57506005544267ffffffffffffffff90911610155b6008549091505f9067ffffffffffffffff1615801590610a5957506008544267ffffffffffffffff90911610155b90507f0000000000000000000000000000000000000000000000000000000000000000610a8e578180610a895750805b610a98565b818015610a985750805b9250505090565b80471015610ae45760405162461bcd60e51b8152602060048201526012602482015271496e73756666696369656e742066756e647360701b6044820152606401610389565b8015610b9757604080515f808252602082019092526001600160a01b038416908390604051610b139190610deb565b5f6040518083038185875af1925050503d805f8114610b4d576040519150601f19603f3d011682016040523d82523d5f602084013e610b52565b606091505b5050905080610b955760405162461bcd60e51b815260206004820152600f60248201526e151c985b9cd9995c8819985a5b1959608a1b6044820152606401610389565b505b5050565b5f60208284031215610bab575f80fd5b813567ffffffffffffffff811115610bc1575f80fd5b82016101808185031215610bd3575f80fd5b9392505050565b5f60208284031215610bea575f80fd5b5035919050565b5f808335601e19843603018112610c06575f80fd5b83018035915067ffffffffffffffff821115610c20575f80fd5b602001915036819003821315610c34575f80fd5b9250929050565b5f60208284031215610c4b575f80fd5b81356001600160a01b0381168114610bd3575f80fd5b80356001600160701b0381168114610c77575f80fd5b919050565b5f8060408385031215610c8d575f80fd5b610c9683610c61565b9150610ca460208401610c61565b90509250929050565b634e487b7160e01b5f52601160045260245ffd5b8082028115828204841417610cd857610cd8610cad565b92915050565b5f82610cf857634e487b7160e01b5f52601260045260245ffd5b500490565b80820180821115610cd857610cd8610cad565b81810381811115610cd857610cd8610cad565b5f5b83811015610d3d578181015183820152602001610d25565b50505f910152565b5f8151808452610d5c816020860160208601610d23565b601f01601f19169290920160200192915050565b602081528151602082015260018060a01b03602083015116604082015267ffffffffffffffff60408301511660608201525f6060830151608080840152610dba60a0840182610d45565b949350505050565b602081525f610bd36020830184610d45565b5f60208284031215610de4575f80fd5b5051919050565b5f8251610dfc818460208701610d23565b919091019291505056fea26469706673582212200355f76fbf2c99474b07177b457c5aad0e3a537610e9ed869e526a2d94ca517964736f6c63430008140033a65f96fc951c35ead38878e0f0b7a3c744a6f5ccc1476b313353ce31712313ad1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1' as const;

export const PRICE_GATE_PIPELINE_SOURCE = "// SPDX-License-Identifier: MIT\npragma solidity >=0.8.20;\n\nimport {IReactive} from '@reactive-network/reactive-lib/src/interfaces/IReactive.sol';\nimport {AbstractReactive} from '@reactive-network/reactive-lib/src/abstract-base/AbstractReactive.sol';\nimport {ISystemContract} from '@reactive-network/reactive-lib/src/interfaces/ISystemContract.sol';\nimport {IOmniCallbackSystem} from './StopLoss_Pipeline.sol';\nimport {PriceOrderVault, GateOrder} from './PriceOrderVault.sol';\n\n/// @notice Combines independent Base Sepolia pool observations within a Lasna receipt-time window.\ncontract PriceGatePipeline is IReactive, AbstractReactive {\n    struct Config {\n        address primaryPool;\n        address confirmationPool;\n        address vault;\n        uint256 primaryThreshold;\n        uint256 confirmationThreshold;\n        uint32 freshnessSeconds;\n        uint32 cooldownSeconds;\n        bool requireBoth;\n    }\n\n    struct Observation {\n        uint256 sourceBlock;\n        uint256 sourceIndex;\n        uint64 validUntil;\n    }\n\n    address private constant OMNI_SYSTEM = 0x8888888888888888888888888888888888888888;\n    uint256 private constant BASE_SEPOLIA = 84532;\n    uint256 private constant SYNC = uint256(keccak256(\"Sync(uint112,uint112)\"));\n    uint64 private constant CALLBACK_GAS = 350_000;\n\n    address public immutable primaryPool;\n    address public immutable confirmationPool;\n    address public immutable vault;\n    uint256 public immutable primaryThreshold;\n    uint256 public immutable confirmationThreshold;\n    uint32 public immutable freshnessSeconds;\n    uint32 public immutable cooldownSeconds;\n    bool public immutable requireBoth;\n\n    Observation private primary;\n    Observation private confirmation;\n    bool public episodeActive;\n    uint256 public lastTriggeredTimestamp;\n\n    event OmniCallbackRequested(uint256 indexed chain_id, address indexed _contract, uint64 indexed gas_limit, bytes payload);\n\n    constructor(Config memory config) payable {\n        require(OMNI_SYSTEM.code.length != 0, \"Omni system unavailable\");\n        require(config.vault != address(0) && config.primaryPool != address(0)\n            && config.confirmationPool != address(0) && config.primaryPool != config.confirmationPool, \"Invalid pools\");\n        require(config.primaryThreshold != 0 && config.confirmationThreshold != 0\n            && config.freshnessSeconds > 0 && config.freshnessSeconds <= 180, \"Invalid gate configuration\");\n        primaryPool = config.primaryPool;\n        confirmationPool = config.confirmationPool;\n        vault = config.vault;\n        primaryThreshold = config.primaryThreshold;\n        confirmationThreshold = config.confirmationThreshold;\n        freshnessSeconds = config.freshnessSeconds;\n        cooldownSeconds = config.cooldownSeconds;\n        requireBoth = config.requireBoth;\n\n        vendor = service = ISystemContract(payable(OMNI_SYSTEM));\n        addAuthorizedSender(OMNI_SYSTEM);\n        service.subscribe(BASE_SEPOLIA, primaryPool, SYNC, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);\n        service.subscribe(BASE_SEPOLIA, confirmationPool, SYNC, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);\n    }\n\n    function react(LogRecord calldata log) external {\n        require(msg.sender == OMNI_SYSTEM, \"Only Omni system\");\n        if (log.chain_id != BASE_SEPOLIA || log.topic_0 != SYNC || log.data.length != 64\n            || log.block_number == 0 || (log._contract != primaryPool && log._contract != confirmationPool)) return;\n        bool isPrimary = log._contract == primaryPool;\n        Observation storage next = isPrimary ? primary : confirmation;\n        if (log.block_number < next.sourceBlock\n            || (log.block_number == next.sourceBlock && log.log_index <= next.sourceIndex)) return;\n\n        if (!_qualifies()) episodeActive = false;\n        next.sourceBlock = log.block_number;\n        next.sourceIndex = log.log_index;\n        (uint112 reserve0, uint112 reserve1) = abi.decode(log.data, (uint112, uint112));\n        uint256 threshold = isPrimary ? primaryThreshold : confirmationThreshold;\n        bool hit = reserve0 != 0 && reserve1 != 0 && uint256(reserve1) * 1e18 / reserve0 <= threshold;\n        next.validUntil = hit ? uint64(block.timestamp + freshnessSeconds) : 0;\n        if (!_qualifies()) {\n            episodeActive = false;\n            return;\n        }\n        if (episodeActive || (lastTriggeredTimestamp != 0 && block.timestamp - lastTriggeredTimestamp < cooldownSeconds)) {\n            return;\n        }\n\n        episodeActive = true;\n        lastTriggeredTimestamp = block.timestamp;\n        GateOrder memory order = GateOrder({\n            executionId: keccak256(abi.encode(log.chain_id, log._contract, log.tx_hash, log.log_index)),\n            primaryValidUntil: primary.validUntil,\n            confirmationValidUntil: confirmation.validUntil\n        });\n        bytes memory payload = abi.encodeCall(PriceOrderVault.executePriceGate, (address(0), order));\n        IOmniCallbackSystem(OMNI_SYSTEM).requestCallbackV_1_0(\n            IOmniCallbackSystem.Configuration(BASE_SEPOLIA, vault, CALLBACK_GAS, payload)\n        );\n        emit OmniCallbackRequested(BASE_SEPOLIA, vault, CALLBACK_GAS, payload);\n    }\n\n    function _qualifies() private view returns (bool) {\n        bool primaryFresh = primary.validUntil != 0 && primary.validUntil >= block.timestamp;\n        bool confirmationFresh = confirmation.validUntil != 0 && confirmation.validUntil >= block.timestamp;\n        return requireBoth ? primaryFresh && confirmationFresh : primaryFresh || confirmationFresh;\n    }\n}\n";

