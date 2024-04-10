echo "getting code";
if [ ! -d $PWD/hello-web-again ]; 
repoName="vastai-whisper-script"
then
  git clone --depth=1 "https://github.com/awfulbananas/$repoName.git" "$PWD/$repoName";
  echo "installing dependencies";
  pip install --no-cache-dir -r $PWD/$repoName/requirements.txt;
  pip install --no-cache-dir pytube git+https://github.com/24makee/pytube.git@c709202d4f2c0d36d9484314d44fd26744225b7d;
else
  cd $PWD/$repoName;
  git pull --no-rebase;
  cd ..;
fi
echo "running script";
python $PWD/$repoName/app.py;