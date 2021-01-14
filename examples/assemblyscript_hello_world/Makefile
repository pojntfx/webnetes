all:
	@docker run -v ${PWD}:/src:z node sh -c 'cd /src && yarn && yarn asbuild'
	@docker run -v ${PWD}:/src:z alphahorizonio/wasi-sdk sh -c 'cd /src && wasm-opt --asyncify -O build/optimized.wasm -o build/optimized.wasm'

clean:
	@rm -rf build

seed: all
	@docker run -it -v ${PWD}/build:/build:z --entrypoint=/bin/sh schaurian/webtorrent-hybrid -c "/usr/local/bin/webtorrent-hybrid seed /build/optimized.wasm"