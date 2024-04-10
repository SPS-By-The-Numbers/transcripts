echo "getting code";
if [ ! -d $PWD/hello-web-again ]; 
repoName="vastai-whisper-script"
then
  git clone --depth=1 "https://github.com/awfulbananas/$repoName.git" "$PWD/$repoName";
  echo "installing dependencies";
  pip install --no-cache-dir -r $PWD/$repoName/requirements.txt;
else
  cd $PWD/$repoName;
  git pull --no-rebase;
  cd ..;
fi
echo "running script";
python $PWD/$repoName/transcribe_worker.py;
