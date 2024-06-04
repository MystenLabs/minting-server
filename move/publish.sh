
#!/bin/bash

# check dependencies are available.
for i in jq curl sui; do
  if ! command -V ${i} 2>/dev/null; then
    echo "${i} is not installed"
    exit 1
  fi
done

NETWORK=https://rpc.testnet.sui.io:443
BACKEND_API=https://faucet.testnet.sui.io/gas
FAUCET=https://api-testnet.suifrens.sui.io

MOVE_PACKAGE_PATH=contract_example

if [ $# -ne 0 ]; then
  if [ $1 = "testnet" ]; then
    NETWORK="https://rpc.testnet.sui.io:443"
    FAUCET="https://faucet.testnet.sui.io/gas"
    BACKEND_API="https://api-testnet.suifrens.sui.io"
  fi
  if [ $1 = "devnet" ]; then
    NETWORK="https://rpc.devnet.sui.io:443"
    FAUCET="https://faucet.devnet.sui.io/gas"
    BACKEND_API="https://api-devnet.suifrens.sui.io"
  fi
fi

echo "- Admin Address is: ${ADMIN_ADDRESS}"

import_address=$(sui keytool import "$ADMIN_PHRASE" ed25519)

switch_res=$(sui client switch --address ${ADMIN_ADDRESS})

#faucet_res=$(curl --location --request POST "$FAUCET" --header 'Content-Type: application/json' --data-raw '{"FixedAmountRequest": { "recipient": '$ADMIN_ADDRESS'}}')

publish_res=$(sui client publish --skip-fetch-latest-git-deps --gas-budget 2000000000 --json ${MOVE_PACKAGE_PATH})

echo ${publish_res} >.publish.res.json

# Check if the command succeeded (exit status 0)
if [[ "$publish_res" =~ "error" ]]; then
  # If yes, print the error message and exit the script
  echo "Error during move contract publishing.  Details : $publish_res"
  exit 1
fi

publishedObjs=$(echo "$publish_res" | jq -r '.objectChanges[] | select(.type == "published")')

PACKAGE_ID=$(echo "$publishedObjs" | jq -r '.packageId')

newObjs=$(echo "$publish_res" | jq -r '.objectChanges[] | select(.type == "created")')

ADMIN_ID=$(echo "$newObjs" | jq -r 'select (.objectType | contains("AdminCap")).objectId')


suffix=""
if [ $# -eq 0 ]; then
  suffix=".localnet"
fi

cat >../.env<<-API_ENV
SUI_NETWORK=$NETWORK
BACKEND_API=$BACKEND_API
PACKAGE_ADDRESS=$PACKAGE_ID
ADMIN_CAP=$ADMIN_ID
API_ENV

echo "Contract Deployment finished!"
