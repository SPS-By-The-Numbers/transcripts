#syntax=docker/dockerfile:1.4

FROM pytorch/pytorch:2.7.1-cuda11.8-cudnn9-runtime

WORKDIR /workspace/app
COPY prime_model.mp4 /workspace/app/

# Install all the programs and setup the paths.
RUN <<EOF
  apt-get -y update
  apt-get -y install git ffmpeg
EOF

RUN <<EOF
  pip install whisperx==3.4.2

  # HACKHACK: This technically is incompatible with whisper 3.4.2 but it also removes the cudnn8 dependency.
  pip install ctranslate2==4.6.0

  # HACKHACK: Another internally inconsistent dependency in whisper 3.4.2 through mathplotlib.
  pip install python-dateutil==3.7

  # Needed to get shared libraries working right for whisper 3.4.2 on pytorch 2.7.1 docker.
  pip install nvidia-cublas-cu12==12.9.1.4 
  CUDNN_PATH=$(dirname $(find / -name 'libcudnn.so.*' | head -1))
  CUBLAS_PATH=$(dirname $(find / -name 'libcublas.so.*' | head -1))
  echo "export LD_LIBRARY_PATH=${CUDNN_PATH}:${CUBLAS_PATH}:\${LD_LIBRARY_PATH}" >> /root/.bashrc
EOF

# Use int8 compute type just to make whisperx always complete at this step.
RUN --mount=type=secret,id=HF_TOKEN <<EOF
  whisperx --model=large-v3-turbo --language=en --thread=4 --hf_token=$(cat /run/secrets/HF_TOKEN) --diarize --output_form=json --compute_type=int8 --output_dir=/tmp -- prime_model.mp4
EOF

RUN pip install vastai==0.3.1

COPY requirements.txt /workspace/app/
RUN pip install -r requirements.txt

RUN <<EOF
apt clean
apt-get -y install curl unzip
curl -fsSL https://fnm.vercel.app/install | bash
~/.local/share/fnm/fnm install --lts
apt clean
EOF

COPY transcribe_worker.py lysine_protocol.sh onstart_hook.sh /workspace/app/
RUN chmod 755 /workspace/app/transcribe_worker.py /workspace/app/lysine_protocol.sh /workspace/app/onstart_hook.sh
