import subprocess
from subprocess import PIPE

searchCall = ['vastai', 'search offers', 'cpu_cores>=10 total_gpu_ram>=8 reliability>=0.95 dph<2']
def find_instance():
    searchOut = subprocess.run(searchCall, check=True, stdout=PIPE).stdout
    print(searchOut)