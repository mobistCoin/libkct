const axios = require('axios')
const util = require("util")
const urlExistSync = require("url-exist-sync")

const dateFormat = require('dateformat')

const setting = require("setting")

/*****************************************************************************
 * 단독 실행 함수들의 모음.
 */
/**
 * 아이디에 대한 비밀번호 문자열을 만들기 위한 함수이다.
 * @param iLength
 * @returns {string}
 */
module.exports.createPW = function createCode(iLength) {
    let arr = ("0,1,2,3,4,5,6,7,8,9,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z," +
        "A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,~,!,@,#,%,^,&,*").split(",")
    let randomStr = ""
    for (let j = 0; j < iLength; j++) {
        randomStr += arr[Math.floor(Math.random() * arr.length)]
    }
    return randomStr
}

/**
 * ID를 만들기 위한 함수이다.
 * @param iLength
 * @returns {string}
 */
module.exports.createID = function createID(iLength) {
    let arr = ("0,1,2,3,4,5,6,7,8,9,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z," +
        "A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z").split(",")
    let randomStr = "MITX"
    let size = iLength - randomStr.length
    for (let j = 0; j < size; j++) {
        randomStr += arr[Math.floor(Math.random() * arr.length)]
    }
    return randomStr
}

/**
 * mainnet / testnet 구분하여 public api 용 hostname 반환용 함수
 * @param {number} chainId  mainnet: 8217, testnet: 1001
 * @returns {string} API 접근용 hostname
 */
function getHostUrl(chainId) {
    let url
    if (chainId === 8217) {
        url = "https://api-cypress.scope.klaytn.com/"
    } else {
        url = "https://api-baobab.scope.klaytn.com/"
    }
    return url
}

/**
 * 클레이튼 API의 실행용 bytecode를 작성하는 함수.
 * @param address
 * @param amount
 * @returns {string}
 */
function transferByteInput(address, amount) {
    /**
     * transfer 함수의 bytecode
     * @type {string}
     */
    const funcName = "0xa9059cbb"
    /**
     * Token 전송 대상이 되는 지갑 주소
     * @type {string} 64 byte 길이의 문자열
     */
    let toAddr = address.substr(2).padStart(64, '0')
    /**
     * 전송되는 token 수량을 지정
     * @type {string} 64 byte 길이의 문자열
     */
    let toAmount = amount.padStart(64, '0')

    /**
     * 만들어진 string 들을 전부 합하여 결과값으로 반환
     */
    return funcName + toAddr + toAmount
}

/*****************************************************************************
 * KAS API 사용한 함수의 모음
 */

/**
 * FT smart contract 거래 내역을 eoa를 기준으로 확인할 수 있는 함수이다.
 * caver-js에서 아직 kip7을 지원하지 않아 작성된 함수이다.
 * @param chainId baobab testnet과 mainnet을 구분하여 접속하는 값.(cypress: 8217, baobab: 1001)
 * @param accessKeyId API console에서 발급받은 접속용 key id
 * @param secretAccessKey API console에서 발급받은 접속용 secret key
 * @param contract 조회하고자 하는 smart contract 주소
 * @param eoa 조회하고자 하는 토큰 거래용 주소
 * @returns {Promise<AxiosResponse<any>>} 비동기 함수의 리턴값으로 값이 저장되는 것을 기다렸다가 사용해야한다.
 */
module.exports.historyEoa =
    async function RestHistoryEOAFunction(chainId, accessKeyId, secretAccessKey, contract, eoa) {
        let url = "https://th-api.klaytnapi.com/v2/transfer/account/"
        let request = url.concat(eoa)

        /**
         * header에 설정되어야 하는 값을 입력함.
         * x-chain-id 값은 1001로 설정되어 klaytn의 baobab 테스트 네트워크를 사용하도록 변경한다.
         */
        const headers = {
            'Content-Type': 'application/json',
            'x-chain-id': chainId
        }
        /**
         * 인증 내역은 username과 password를 사용하여 API의 인증을 진행한다.
         * username은 accessKeyId를 사용하여 설정하고
         * password는 secretAccessKey를 사용하여 설정한다.
         * 이 값을 POST 혹은 GET 하면서 전송하도록 한다.
         */
        const auth = {
            username: accessKeyId,
            password: secretAccessKey
        }

        const param = {
            'kind': "ft",
            'ca-filter': contract
        }

        /**
         * axios를 사용하여 실제 get으로 명령을 실행하는 부분이다.
         */
        return await axios.get(request, {auth: auth, headers: headers, params: param})
            .then(response => {
                return response.data
            })
            .catch(error => {
                console.log(error);
            });
    }

/**
 * FT smart contract 거래 내역을 eoa를 기준으로 확인할 수 있는 함수이다.
 * caver-js에서 아직 kip7을 지원하지 않아 작성된 함수이다.
 * @param chainId baobab testnet과 mainnet을 구분하여 접속하는 값.(cypress: 8217, baobab: 1001)
 * @param accessKeyId API console에서 발급받은 접속용 key id
 * @param secretAccessKey API console에서 발급받은 접속용 secret key
 * @param preset 조회하고자 하는 지갑 주소와 contract 주소의 preset.
 * @returns {Promise<AxiosResponse<any>>} 비동기 함수의 리턴값으로 값이 저장되는 것을 기다렸다가 사용해야한다.
 */
module.exports.historyPreset =
    async function RestHistoryEOAFunction(chainId, accessKeyId, secretAccessKey, preset) {
        let request = "https://th-api.klaytnapi.com/v2/transfer"

        /**
         * header에 설정되어야 하는 값을 입력함.
         * x-chain-id 값은 1001로 설정되어 klaytn의 baobab 테스트 네트워크를 사용하도록 변경한다.
         */
        const headers = {
            'Content-Type': 'application/json',
            'x-chain-id': chainId
        }
        /**
         * 인증 내역은 username과 password를 사용하여 API의 인증을 진행한다.
         * username은 accessKeyId를 사용하여 설정하고
         * password는 secretAccessKey를 사용하여 설정한다.
         * 이 값을 POST 혹은 GET 하면서 전송하도록 한다.
         */
        const auth = {
            username: accessKeyId,
            password: secretAccessKey
        }

        const param = {
            'presets': preset
        }

        /**
         * axios를 사용하여 실제 get으로 명령을 실행하는 부분이다.
         */
        return await axios.get(request, {auth: auth, headers: headers, params: param})
            .then(response => {
                return response.data
            })
            .catch(error => {
                console.log(error);
            });
    }

/**
 * restful API를 사용하여 API를 사용하는 함수이다.
 * caver-js에서 아직 kip7을 지원하지 않아 작성된 함수이다.
 * @param chainId baobab testnet과 mainnet을 구분하여 접속하는 값.(cypress: 8217, baobab: 1001)
 * @param accessKeyId API console에서 발급받은 접속용 key id
 * @param secretAccessKey API console에서 발급받은 접속용 secret key
 * @param contract 조회하고자 하는 smart contract 주소
 * @param eoa 조회하고자 하는 토큰 거래용 주소
 * @returns {Promise<AxiosResponse<any>>} 비동기 함수의 리턴값으로 값이 저장되는 것을 기다렸다가 사용해야한다.
 */
module.exports.balanceFT =
    async function (chainId, accessKeyId, secretAccessKey, contract, eoa) {
        let url = "https://kip7-api.klaytnapi.com/v1/contract/"
        let contract_url = url.concat(contract, "/account/")
        let request = contract_url.concat(eoa, "/balance")

        /**
         * header에 설정되어야 하는 값을 입력함.
         * x-chain-id 값은 1001로 설정되어 klaytn의 baobab 테스트 네트워크를 사용하도록 변경한다.
         */
        const headers = {
            'Content-Type': 'application/json',
            'x-chain-id': chainId
        }
        /**
         * 인증 내역은 username과 password를 사용하여 API의 인증을 진행한다.
         * username은 accessKeyId를 사용하여 설정하고
         * password는 secretAccessKey를 사용하여 설정한다.
         * 이 값을 POST 혹은 GET 하면서 전송하도록 한다.
         */
        const auth = {
            username: accessKeyId,
            password: secretAccessKey
        }

        /**
         * axios를 사용하여 실제 get으로 명령을 실행하는 부분이다.
         */
        return await axios.get(request, {auth: auth, headers: headers})
            .then(response => {
                return response.data;
            })
            .catch(error => {
                console.log(error);
            });
    }

/**
 * 수수료 대납용 계정 생성 함수
 * @param chainId
 * @param accessKeyId
 * @param secretAccessKey
 * @returns {Promise<AxiosResponse<any>>}
 */
module.exports.feePayerCreate =
    async function (chainId, accessKeyId, secretAccessKey) {
        const request = "http://wallet-api.klaytnapi.com/v2/feepayer"

        /**
         * header에 설정되어야 하는 값을 입력함.
         * x-chain-id 값은 1001로 설정되어 klaytn의 baobab 테스트 네트워크를 사용하도록 변경한다.
         */
        const headers = {
            'Content-Type': 'application/json',
            'x-chain-id': chainId
        }

        /**
         * 인증 내역은 username과 password를 사용하여 API의 인증을 진행
         * username은 accessKeyId를 사용하여 설정
         * password는 secretAccessKey를 사용하여 설정
         */
        const auth = {
            username: accessKeyId,
            password: secretAccessKey
        }

        /**
         * 수수료 대납용 계좌를 생성하는 klaytn API 를 호출하여 실행
         */
        return await axios.post(request, "", {auth: auth, headers: headers})
            .then(response => {
                return response.data;
            })
            .catch(error => {
                console.log(error);
            });
    }

/**
 * 수수료 대납용 API 함수
 * @param chainId
 * @param accessKeyId
 * @param secretAccessKey
 * @param contract
 * @param from
 * @param to
 * @param amount
 * @param feePayer
 * @returns {Promise<AxiosResponse<any>>}
 * @constructor
 */
module.exports.TransferFTfee =
    async function RestTransferFeeFunction(chainId, accessKeyId, secretAccessKeyPw, contract, from, to, amount,
                                           feePayer) {
        /**
         * Token 전송용 base url
         * @type {string}
         */
        var request = "https://wallet-api.klaytnapi.com/v2/tx/fd-user/contract/execute"

        /**
         * header에 설정되어야 하는 값을 입력함.
         * x-chain-id 값은 1001로 설정되어 klaytn의 baobab 테스트 네트워크를 사용하도록 변경한다.
         */
        const headers = {
            'Content-Type': 'application/json',
            'x-chain-id': chainId
        }
        /**
         * 인증 정보는 username과 password를 사용하여 API의 인증용 정보를 설정
         * username은 accessKeyId를 사용하여 설정
         * password는 secretAccessKey를 사용하여 설정
         */
        const auth = {
            username: accessKeyId,
            password: secretAccessKeyPw
        }

        /**
         * 토큰 전송정보를 가지는 input bytecode를 만든다.
         * @type {string} Smart Contract에서 실행될 bytecode
         */
        const byteInput = transferByteInput(to, amount.substr(2))

        /**
         * Fee Delegation Transfer을 실행시킬 정보를 작성하는 부분
         * @type {{input: string, feePayer, submit: boolean, from, to}}
         */
        const body = {
            "from": from,
            "to": contract,
            "input": byteInput,
            "feePayer": feePayer,
            "submit": true
        }

        /**
         * Fee delegation 정보를 사용하여 klaytn API를 실행한다.
         */
        return await axios.post(request, body, {auth: auth, headers: headers})
            .then(response => {
                return response.data
            })
            .catch(error => {
                console.log(error);
            });
    }

/**
 * Token 전송용 함수이다. 이 함수는 개선이 필요한다.
 * @param chainId
 * @param accessKeyId
 * @param secretAccessKey
 * @param contract
 * @param from
 * @param to
 * @param amount
 * @returns {Promise<AxiosResponse<any>>}
 * @constructor
 */
module.exports.TransferFT =
    async function RestTransferFunction(chainId, accessKeyId, secretAccessKey, contract, from, to, amount) {
        let url = "https://kip7-api.klaytnapi.com/v1/contract/"
        let request = url.concat(contract, "/transfer")

        /**
         * header에 설정되어야 하는 값을 입력함.
         * x-chain-id 값은 1001로 설정되어 klaytn의 baobab 테스트 네트워크를 사용하도록 변경한다.
         */
        const headers = {
            'Content-Type': 'application/json',
            'x-chain-id': chainId
        }
        /**
         * 인증 정보는 username과 password를 사용하여 API의 인증용 정보를 설정
         * username은 accessKeyId를 사용하여 설정
         * password는 secretAccessKey를 사용하여 설정
         */
        const auth = {
            username: accessKeyId,
            password: secretAccessKey
        }
        /**
         * body 내용에는 from과 to, amount 필드를 포함하고 있으며
         * 이 필드의 값으로 전송량과 계좌간 전송이 이루어진다.
         * from 토큰을 전송하려는 계좌
         * to 토큰을 전송받는 계좌
         * amount 전송되는 토큰량
         */
        const body = {
            "from": from,
            "to": to,
            "amount": amount
        }

        /**
         * axios를 사용하여 실제 post로 명령을 실행하는 부분이다.
         */
        return await axios.post(request, body, {auth: auth, headers: headers})
            .then(response => {
                return response.data
            })
            .catch(error => {
                console.log(error)
            });
    }

/**
 *
 * @param chainId
 * @param accessKeyId
 * @param secretAccessKey
 * @returns {Promise<AxiosResponse<any>>}
 * @constructor
 */
module.exports.AccountCreate =
    async function RestAccountCreateFunction(chainId, accessKeyId, secretAccessKey) {
        let url = "http://wallet-api.klaytnapi.com/v2/account"

        /**
         * header에 설정되어야 하는 값을 입력함.
         * x-chain-id 값은 1001로 설정되어 klaytn의 baobab 테스트 네트워크를 사용하도록 변경한다.
         */
        const headers = {
            'Content-Type': 'application/json',
            'x-chain-id': chainId
        }

        /**
         * 인증 정보는 username과 password를 사용하여 API의 인증용 정보를 설정
         * username은 accessKeyId를 사용하여 설정
         * password는 secretAccessKey를 사용하여 설정
         */
        const auth = {
            username: accessKeyId,
            password: secretAccessKey
        }

        /**
         * axios를 사용하여 실제 post로 명령을 실행하는 부분이다.
         */
        return await axios.post(url, "", {auth: auth, headers: headers})
            .then(response => {
                return response.data
            })
            .catch(error => {
                console.log(error)
            });
    }

/*****************************************************************************
 * klaytn public Url API 모음
 */

/**
 * TxHash 값을 확인하는 함수이다.
 * @param txs TxHash 주소값
 * @returns {Promise<AxiosResponse<*>>}
 * @constructor
 */
module.exports.GetTxStatus =
    async function (chainId, txs) {
        /**
         * TxHash 값을 확인하는 base url.
         * @type {string}
         */
        let tx_url = getHostUrl(chainId)

        /**
         * 토큰 전송이 완료되어 전송 기록이 있는 txHash 값이 나오면 이를 검증함.
         * 전송 성공 혹은 실패가 기록되는 부분에 대해서 확인하기 위한 부분임.
         * @type {string} 완성된 TxHash 주소
         */
        let request = tx_url.concat('/v1/txs/', txs)

        /**
         * TxHash URL이 만들어지는데 시간이 걸리므로 txHash 값이 나올때까지 대기함.
         * TxHash 주소 값의 오류가 있는 경우에 발생할 문제에 대한 예외 처리 필요.
         */
        while (!urlExistSync(request)) {
            ;
        }

        /**
         * txHash URL이 만들어지면 상태 값을 가져옴.
         * transactionHash 값을 얻어오지 못하는 경우의 예외 처리 필요.
         * @type {AxiosResponse<any>}
         */
        const resultStatus = await axios.get(request)
            .then(response => {
                return response.data
            })
            .catch(error => {
                console.log(error)
            });

        /**
         * TxHash 상태값을 결과값으로 반환
         */
        return resultStatus
    }

/**
 * Web API를 사용하여 지갑의 정보를 가져오는 함수
 * 여기에서 나오는 잔액은 KLAY이다.
 * @param address
 * @returns {Promise<AxiosResponse<any>>}
 * @constructor
 */
module.exports.AccountInfo =
    async function (chainId, address) {
        let url = getHostUrl(chainId)
        const request = url.concat('v1/accounts/', address)

        return axios.get(request)
            .then(response => {
                return response.data
            })
            .catch(error => {
                console.log(error)
            })
    }

/**
 * WebAPI를 사용하여 지갑의 Transaction 기록을 가져올 수 있는 함수
 * @param address
 * @returns {Promise<AxiosResponse<any>>}
 * @constructor
 */
module.exports.AccountTxs =
    async function (chainId, address) {
        let url = getHostUrl(chainId)
        const request = url.concat('v1/accounts/', address, "/txs")

        return axios.get(request)
            .then(response => {
                return response.data
            })
            .catch(error => {
                console.log(error)
            })
    }

/**
 * Contract 전송 내역을 확인할 수 있는 함수
 * 모든 contract의 내역을 보내며 전체 100개의 기록을 반환한다.
 * @param eoa
 * @returns {Promise<AxiosResponse<any>>}
 * @constructor
 */
module.exports.AccountTransfers =
    function (chainId, eoa) {
        let url = getHostUrl(chainId)
        const request = url.concat('v1/accounts/', eoa, "/transfers?limit=100")

        return axios.get(request)
            .then(response => {
                return response.data;
            })
            .catch(error => {
                console.log(error)
            })
    }

/**
 * Token Holders 자료 수집 함수.
 * 테스트 안되어 있음.
 * @param contract
 * @returns {Promise<AxiosResponse<any>>}
 * @constructor
 */
module.exports.ContractHolders =
    async function (chainId, contract) {
        let url = getHostUrl(chainId)
        const request = url.concat('v1/tokens/', contract, "/holders");

        return axios.get(request)
            .then(response => {
                return response.data;
            })
            .catch(error => {
                console.log(error)
            })
    }

/**
 * Smart Contract 거래 기록들을 확인
 * @param contract
 * @returns {Promise<AxiosResponse<any>>}
 * @constructor
 */
module.exports.ContractTransfers =
    async function (chainId, contract) {
        let url = getHostUrl(chainId)
        const request = url.concat('v1/tokens/', contract, "/transfers?limit=1000")

        return axios.get(request)
            .then(response => {
                return response.data
            })
            .catch(error => {
                console.log(error)
            })
    }

/**
 * Token을 가지고 있는 지갑들의 리스트를 가져오는 함수
 * @param address
 * @returns {Promise<AxiosResponse<any>>}
 * @constructor
 */
module.exports.TokenBalance =
    async function (chainId, address) {
        let url = getHostUrl(chainId)
        const request = url.concat('v1/accounts/', address, "/balances");

        return axios.get(request)
            .then(response => {
                return response.data;
            })
            .catch(error => {
                console.log(error)
            })
    }

module.exports.getTxs =
    async function (chainId, eoa) {
        let url = getHostUrl(chainId)
        const request = url.concat('v1/accounts/', eoa, '/txs')
    }

module.exports.GetSVC =
    function (connection, svc_id) {
        let accesskey = ""
        let secretaccesskey = ""

        sql = 'SELECT * FROM svc where pid=' + svc_id

        connection.query(sql, function (error, results, fields) {
            if (error) {
                console.log(error)
            }
            accesskey = results[0].accesskey
            secretaccesskey = results[0].secretaccesskey
            dbValue = [accesskey, secretaccesskey]
        });

        return [accesskey, secretaccesskey]
    }

module.exports.SetSVC =
    function (res, connection, id, pw) {
        const today = dateFormat(new Date(), "yyyymmdd")

        const sql = 'SELECT count(*) as rowCount FROM svc where pid like "' + today + '%"'

        connection.query(sql, function (error, results, fields) {
            if (error) {
                console.log(error)
            }
            let result = {}

            result.id = id
            result.password = pw

            num = results[0].rowCount

            if (num >= 0 && num < 99) {
                num = num + 1
                const today = dateFormat(new Date(), "yyyymmdd")
                let pid = today.concat(num.toString().padStart(2, '0'))

                const sql = 'INSERT INTO svc VALUES("' + pid + '", "' + id + '", "' + pw + '")'

                connection.query(sql, function (error, results, fields) {
                    if (error) {
                        console.log(error)
                    }
                });
                return res.send(result)
            } else {
                return res.send('{"status": "Overrun"}')
            }
        });
    }

