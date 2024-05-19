FROM pytorch/pytorch

RUN <<EOF bash
apt-get -y update
apt-get -y install git ffmpeg

pip install git+https://github.com/m-bain/whisperx.git
EOF

COPY requirements.txt /workspace/app/

WORKDIR /workspace/app
RUN pip install -r requirements.txt

COPY transcribe_worker.py lysine_protocol.sh

CMD lysine_protocol.sh & python transcribe_worker.py -d -t 1
