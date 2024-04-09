echo "getting code";
git clone "https://github.com/awfulbananas/hello-web-again.git" "$PWD/hello-web-again";
echo "installing dependencies";
pip install --no-cache-dir -r $PWD/hello-web-again/requirements.txt;
pip install --no-cache-dir pytube git+https://github.com/24makee/pytube.git@c709202d4f2c0d36d9484314d44fd26744225b7d;
echo "running script";
python $PWD/hello-web-again/app.py;