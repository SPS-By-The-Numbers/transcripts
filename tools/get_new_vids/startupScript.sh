echo "getting code";
if [ ! -d $PWD/hello-web-again ]; 
then
  git clone --depth=1 "https://github.com/awfulbananas/hello-web-again.git" "$PWD/hello-web-again";
  echo "installing dependencies";
  pip install --no-cache-dir -r $PWD/hello-web-again/requirements.txt;
  pip install --no-cache-dir pytube git+https://github.com/24makee/pytube.git@c709202d4f2c0d36d9484314d44fd26744225b7d;
else
  cd $PWD/hello-web-again;
  git pull --no-rebase;
  cd ..;
fi
echo "running script";
python $PWD/hello-web-again/app.py;