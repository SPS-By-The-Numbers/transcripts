#!/bin/bash
# !! Contents within this block are managed by 'conda init' !!
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

conda activate whisperx
#conda install -y pytorch==2.0.0 torchaudio==2.0.0 pytorch-cuda=11.7 -c pytorch -c nvidia 
#pip install git+https://github.com/m-bain/whisperx.git
#pip install git+https://github.com/m-bain/whisperx.git --upgrade

#pip install pyannote.audio==3.0.1
#pip uninstall onnxruntime
#pip install --force-reinstall onnxruntime-gpu
