#!/bin/bash

# bootstrap-download-yt-audio.sh ${HOST} ${PORT}

set -x

ssh -p $2 $1 bash <<HEREDOC
  echo "Add gcsfuse package"
  export GCSFUSE_REPO=gcsfuse-\`lsb_release -c -s\`
  echo "deb [signed-by=/usr/share/keyrings/cloud.google.asc] https://packages.cloud.google.com/apt $GCSFUSE_REPO main" | sudo tee /etc/apt/sources.list.d/gcsfuse.list

  echo "Add gcsfuse signing key"
  curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo tee /usr/share/keyrings/cloud.google.asc

  echo "Install gcsfuse"
  sudo apt-get update
  sudo apt-get install gcsfuse
  sudo apt-get install python3 python3-venv
  sudo apt-get install git
HEREDOC

exit



echo "Deploy the gcloud storage key + worker scripts"
scp -P $2 gcloud-storage-key.json download_yt_audio-requirements.txt download_yt_audio.py "$1:"

echo "Mount fuse"
ssh -p $2 $1 bash <<HEREDOC
  set -x
  gcloud auth activate-service-account --key-file=gcloud-storage-key.json

  mkdir data
  gcsfuse --key-file=gcloud-storage-key.json sps-by-the-numbers.appspot.com data
HEREDOC

echo "Setup venv"
ssh -p $2 $1 bash <<HEREDOC
  set -x
  python3 -m venv venv
  source venv/bin/active
  pip install -r download_yt_audio-requirements.txt
HEREDOC
