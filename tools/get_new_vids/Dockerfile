FROM awfulbananas/slim-python-with-git

# Create and change to the app directory.
WORKDIR /usr/src

RUN sudo apt update && sudo apt install ffmpeg

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install whisper git+https://github.com/openai/whisper.git 

COPY startupScript.sh .

#the startup script manages all the initial behaviour
CMD bash startupScript.sh