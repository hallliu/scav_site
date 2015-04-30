from fabric.api import env, run, local, settings, cd

env.hosts = ['hallliu.com']
env.user = 'ubuntu'

def deploy():
    code_dir = '/home/ubuntu/scav_site'
    with settings(warn_only=True):
        if run("test -d %s" % code_dir).failed:
            run("git clone https://github.com/hallliu/scav_site.git %s" % code_dir)
    with cd(code_dir):
        run("git pull")
