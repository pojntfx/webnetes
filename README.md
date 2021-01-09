# webnetes (w6s)

Like Kubernetes, but built with WebAssembly, WebRTC (via [unisockets](https://github.com/alphahorizonio/unisockets/)) and [WebTorrent](https://webtorrent.io/).

![Yarn CI](https://github.com/alphahorizonio/webnetes/workflows/Yarn%20CI/badge.svg)
![make CI](https://github.com/alphahorizonio/webnetes/workflows/make%20CI/badge.svg)
![Mirror](https://github.com/alphahorizonio/webnetes/workflows/Mirror/badge.svg)
[![TypeDoc](https://img.shields.io/badge/TypeScript-Documentation-informational)](https://alphahorizonio.github.io/webnetes/)
[![npm](https://img.shields.io/npm/v/@alphahorizonio/webnetes)](https://www.npmjs.com/package/@alphahorizonio/webnetes)
[![Demo](https://img.shields.io/badge/Demo-webnetes.netlify.app-blueviolet)](https://webnetes.netlify.app/)

## Overview

[![UML Diagram](https://alphahorizonio.github.io/webnetes/media/diagram.svg)](https://alphahorizonio.github.io/webnetes/media/diagram.svg)

TODO: Add overview docs

### Resource Modification Protocol

To manage resources, the following protocol is used:

[![Sequence Diagram](https://alphahorizonio.github.io/webnetes/media/sequence.svg)](https://alphahorizonio.github.io/webnetes/media/sequence.svg)

Note that this protocol is currently being replaced with a new protocol (the "Pipe" protocol), to allow for a singular protocol to be used for both resource management with confirmations and UDP-style "send and forget" messages such as stdin/stdout pipes.

## Usage

TODO: Add usage docs

## License

webnetes (c) 2021 Felix Pojtinger and contributors

SPDX-License-Identifier: AGPL-3.0
