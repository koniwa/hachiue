
# Hachiue: HTML-based audio annotation tool

[![CI](https://github.com/koniwa/hachiue/actions/workflows/ci.yml/badge.svg)](https://github.com/koniwa/hachiue/actions/workflows/ci.yml)
[![Typos](https://github.com/koniwa/hachiue/actions/workflows/typos.yml/badge.svg)](https://github.com/koniwa/hachiue/actions/workflows/typos.yml)
[![CodeQL](https://github.com/koniwa/hachiue/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/koniwa/hachiue/actions/workflows/codeql-analysis.yml)

This tool is designed to work using only the standard functions of web browsers,
and does not exchange data with external servers.

## How to use immediately

Just access [https://koniwa.github.io/hachiue/](https://koniwa.github.io/hachiue/).

## How to use locally

You have two options.

1. Download [the snapshot of hosted files (zip)](https://github.com/koniwa/hachiue/archive/refs/heads/gh-pages.zip) and use them
2. Build locally and use ``src`` folder

    ```bash
    git clone https://github.com/koniwa/hachiue.git
    cd hachiue
    npm install
    npm run build
    ```

## License

GNU Affero General Public License v3.0
