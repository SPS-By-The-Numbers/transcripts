import subprocess
from subprocess import PIPE

searchCall = ['vastai', 'search offers', 'cpu_cores>=10 gpu_total_ram>=8 reliability>=0.95 dph<2']
def find_instance():
    searchOut = subprocess.run(searchCall, check=True, stdout=PIPE).stdout
    print(searchOut)