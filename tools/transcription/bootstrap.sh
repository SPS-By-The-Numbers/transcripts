#!/bin/bash
set -x
echo "Install gcloud cli and vim"
ssh -p $2 $1 <<HEREDOC
   # Install gcloud for access to the data in google cloud storage buckets.
   echo "deb https://packages.cloud.google.com/apt cloud-sdk main" > /etc/apt/sources.list.d/google-cloud-sdk.list
   curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
   apt-get update 
   apt-get -y install google-cloud-cli vim
HEREDOC

echo "Deploy the gcloud storage key + worker scripts"
scp -P $2 gcloud-storage-key.json transcribe_worker.py "$1:"

echo "Auth gcloud. Install setup whisperx in conda. Fix onnxruntime speed issue"

ssh -p $2 $1 <<HEREDOC
  set -x
  gcloud auth activate-service-account --key-file=gcloud-storage-key.json

  conda init bash

  # inline copy-pasta of the conda init entry in .bashrc.
  __conda_setup="$('/opt/conda/bin/conda' 'shell.bash' 'hook' 2> /dev/null)"
  if [ $? -eq 0 ]; then
      eval "$__conda_setup"
  else
    if [ -f "/opt/conda/etc/profile.d/conda.sh" ]; then
        . "/opt/conda/etc/profile.d/conda.sh"
    else
        export PATH="/opt/conda/bin:$PATH"
    fi
  fi
  unset __conda_setup

  # Create the environment if it doesn't exist.
  if ! grep -q whisperx .conda/environments.txt; then
     conda create -y --name whisperx python=3.10
  fi


  conda install -y pytorch==2.0.0 torchaudio==2.0.0 pytorch-cuda=11.7 -c pytorch -c nvidia
  conda run --name whisperx pip install git+https://github.com/m-bain/whisperx.git
  conda run --name whisperx pip install pyannote.audio==3.0.1
  conda run --name whisperx pip uninstall -y onnxruntime
  conda run --name whisperx pip install --force-reinstall onnxruntime-gpu
HEREDOC
