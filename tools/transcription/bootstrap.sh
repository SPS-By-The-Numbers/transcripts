#!/bin/bash
set -x
echo "Install gcloud cli and vim"
ssh -p $2 $1 <<HEREDOC
   echo "deb https://packages.cloud.google.com/apt cloud-sdk main" > /etc/apt/sources.list.d/google-cloud-sdk.list
  curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
   apt-get update 
   apt-get -y install google-cloud-cli vim
HEREDOC

echo "Deploy the gcloud storage key"
scp -P $2 gcloud-storage-key.json "$1:"

echo "Auth gcloud. Install setup whisperx in conda. Fix onnxruntime speed issue"
ssh -p $2 $1 <<HEREDOC
  set -x
  gcloud auth activate-service-account --key-file=gcloud-storage-key.json

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

  grep -q whisperx .conda/environments.txt ||conda create --name whisperx python=3.10
  conda activate whisperx

  conda install -y pytorch==2.0.0 torchaudio==2.0.0 pytorch-cuda=11.8 -c pytorch -c nvidia
  yes | pip install git+https://github.com/m-bain/whisperx.git
  yes | pip install pyannote.audio==3.0.1
  pip uninstall -y onnxruntime
  yes | pip install --force-reinstall onnxruntime-gpu
HEREDOC
