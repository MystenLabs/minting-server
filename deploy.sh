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

ENV="prod"
DOCKER_FILE="docker-compose.yaml"

if [ $# -ne 0 ]; then
  if [ $1 = "local" ]; then
    ENV="local"
    DOCKER_FILE="docker-compose.local.yaml"
  fi
fi

echo "Deploying the minting-server container network in $ENV mode..."

docker compose -f $DOCKER_FILE down && docker compose -f $DOCKER_FILE up --build -d --force-recreate

if [[ $? -ne 0 ]]; then
  echo "ERROR: Failed to deploy the minting-server container network. Check your configuration and try again."
  exit 1
fi

docker compose -f $DOCKER_FILE cp ./smart_contract_config.yaml request_processor:/usr/src/app

if [[ $? -ne 0 ]]; then
  echo "ERROR: Failed to copy smart_contract_config.yaml to the request_processor container."
  exit 1
fi

echo "✔️ Successfully deployed the minting-server container network."
