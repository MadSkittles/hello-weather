const { workspace } = require('vscode');
const GitHubApi = require('@octokit/rest');

const proxyURL =
    workspace.getConfiguration('http')['proxy'] || process.env['http_proxy'];
const publicGist = workspace.getConfiguration('hello')['publicGist'] || true;
let proxyAgent;
if (proxyURL) {
    proxyAgent = require('proxy-agent')(proxyURL);
}

const github = new GitHubApi({
    timeout: 0, // 0 means no request timeout
    headers: {
        accept: 'application/vnd.github.v3+json',
        'user-agent': 'octokit/rest.js v1.2.3' // v1.2.3 will be current version
    },
    baseUrl: 'https://api.github.com',
    agent: proxyAgent
});

const GIST_JSON_EMPTY = {
    description: 'Visual Studio Code Sync Settings Gist',
    public: false,
    files: {
        'Hello Snippets': {
            content: `{ last updated: ${new Date().toJSON()} }`
        }
    }
};

class GitHubService {
    constructor(TOKEN) {
        if (TOKEN) {
            try {
                github.authenticate({
                    type: 'oauth',
                    token: TOKEN
                });
            } catch (error) {}
            github.users.get({}, function(err, res) {
                if (err) {
                    console.log(err);
                } else {
                    this.userName = res.data.login;
                    this.name = res.data.name;
                    console.log(
                        'Sync : Connected with user : ' + this.userName
                    );
                }
            });
        }
    }

    __updateTime(gist) {
        gist.files['Hello Snippets'] = {
            content: `{ last update: ${new Date().toJSON()} }`
        };
    }

    async createEmptyGist() {
        let gist = Object.assign({}, GIST_JSON_EMPTY);
        gist.public = publicGist;
        this.__updateTime(gist);
        try {
            let res = await github.gists.create(gist);
            if (res.data.id) {
                return res.data.id;
            } else {
                console.error('ID is null');
                console.log('Sync : ' + 'Response from GitHub is: ');
                console.log(res);
            }
        } catch (err) {
            console.error(err);
        }
    }

    async uploadSnippet(fileName, content) {
        let gist = Object.assign({}, GIST_JSON_EMPTY);
        const gistId =
            workspace.getConfiguration('hello')['gist'] ||
            '5fe3893d8658a9eee420af32bf9e6255';
        gist.files = { [fileName]: { content } };
        this.__updateTime(gist);
        gist.gist_id = gistId;
        try {
            await github.gists.edit(gist);
            return true;
        } catch (err) {
            return true;
        }
    }
}

module.exports = GitHubService;
