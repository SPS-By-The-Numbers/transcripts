#!/bin/bash
apt-get install ffmpeg python3.8-venv vim
python -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install pydub pyannote.audio torchvision
pip uninstall onnxruntime onnxruntime-gpu
pip install onnxruntime-gpu
