FROM whisperx-ready

RUN pip install requirements.txt

WORKDIR /usr/src

COPY . .

CMD python transcribe_worker.py -d -t 1 & maxTimeScript.sh