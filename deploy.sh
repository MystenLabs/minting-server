#!/bin/zsh

echo "Deploying the minting-server container network..."

if [[ -f "smart_contract_config.yaml" ]]; then
  echo "✔️ smart_contract_config.yaml is present"
else
  echo "ERROR: smart_contract_config.yaml is not present. Please define it first."
  exit 1
fi

if [[ -f ".env" ]]; then
  echo "✔️ .env is present"
else
  echo ".env is not present. Please define it first."
  exit 1
fi

docker compose down && docker compose up --build -d --force-recreate

if [[ $? -ne 0 ]]; then
  echo "ERROR: Failed to deploy the minting-server container network. Check your configuration and try again."
  exit 1
fi

docker compose cp ./smart_contract_config.yaml request_processor:/usr/src/app

if [[ $? -ne 0 ]]; then
  echo "ERROR: Failed to copy smart_contract_config.yaml to the request_processor container."
  exit 1
fi

echo "✔️ Successfully deployed the minting-server container network."
