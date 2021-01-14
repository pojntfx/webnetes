all: native wasm

native:
	@docker run -v ${PWD}:/src:z alphahorizonio/zig-sdk sh -c 'cd /src && zig build-exe --output-dir out main.zig'

wasm:
	@docker run -v ${PWD}:/src:z alphahorizonio/zig-sdk sh -c 'cd /src && zig build-exe --output-dir out -target wasm32-wasi main.zig'
	@docker run -v ${PWD}:/src:z alphahorizonio/wasi-sdk sh -c 'cd /src && wasm-opt --asyncify -O out/main.wasm -o out/main.wasm'

clean:
	@rm -rf out

seed: wasm
	@docker run -it -v ${PWD}/out:/out:z --entrypoint=/bin/sh schaurian/webtorrent-hybrid -c "/usr/local/bin/webtorrent-hybrid seed /out/*.wasm"