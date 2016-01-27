module.exports = function(shipit) {
    require('shipit-deploy')(shipit);
    shipit.initConfig({
        default: {
            workspace: '/tmp/github-monitor',
            deployTo: '/usr/deploy/app',
            repositoryUrl: 'https://github.com/JuneChiu/ssproject.git',
            ignores: ['.git', 'node_modules'],
            rsync: ['--del'],
            keepReleases: 2,
            shallowClone: true
        },
        staging: {
            servers: 'deploy@47.88.160.69'
        }
    });
};
